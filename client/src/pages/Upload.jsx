import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Upload.module.css";

const Upload = () => {
  const navigate = useNavigate();
  const MAX_LIMIT = 10485760;

  const [fields, setFields] = useState([{ id: Math.random(), file: null }]);
  const [totalSize, setTotalSize] = useState(0);

  const findTotalSize = () => {
    let totalSize = 0;
    for (let i = 0; i < fields.length; i++) {
      totalSize += fields[i].file === null ? 0 : fields[i].file.size;
    }
    return totalSize;
  };

  // Add field
  const handleAddField = () => {
    if (fields.length < 5) {
      setFields([...fields, { id: Math.random(), file: null }]);
    } else {
      alert("Maximum of 5 input fields allowed!");
    }
  };

  // change field
  const handleInputChange = (id, event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      setFields((prevFields) => {
        const updatedFields = prevFields.map((field) =>
          field.id === id ? { ...field, file: selectedFile } : field
        );

        // Calculate total size
        const totalSize = updatedFields.reduce((acc, field) => {
          return acc + (field.file ? field.file.size : 0);
        }, 0);

        // Update total size state
        setTotalSize(totalSize);

        return updatedFields;
      });
    }
  };

  // remove field
  const handleRemoveField = (id) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  // submitting the data
  const HandleData = async () => {
    let totalSize = findTotalSize();
    if (totalSize === 0) {
      return alert("you should upload at least one file");
    }

    if (totalSize > MAX_LIMIT) {
      return alert(
        "Please make sure the total fie size should be less than 10 MB"
      );
    }

    var formData = new FormData();

    // Append all selected files to form data
    for (let i = 0; i < fields.length; i++) {
      formData.append("pdfFiles", fields[i].file);
    }

    const response = await fetch(
      `${import.meta.env.VITE_SERVER_URL}/api/v1/filesearch/store`,
      {
        method: "POST",
        body: formData,
      }
    );
    const vector_store = await response.json();

    navigate("/chat", { state: vector_store.data.id });
  };

  return (
    <div className={styles.uploadContainer}>
      <h1>File Upload</h1>

      <div>
        {fields.map((field) => (
          <div key={field.id} className={styles.fileField}>
            <input
              type="file"
              accept=".pdf,application/msword,.docx,.doc"
              required
              onChange={(event) => handleInputChange(field.id, event)}
              className={styles.fileInput}
            />

            {field.file === null ? (
              ""
            ) : (
              <p className={styles.fileSize}>
                size: {((field.file.size * 10) / MAX_LIMIT).toFixed(2)}mb
              </p>
            )}

            <button
              onClick={() => handleRemoveField(field.id)}
              className={styles.removeButton}
            >
              Remove
            </button>
          </div>
        ))}
        <br />
        <button
          onClick={handleAddField}
          disabled={fields.length === 5}
          className={styles.addButton}
        >
          Add
        </button>
      </div>
      <br />

      <p className={styles.fileSize}>
        Total Size: {((totalSize * 10) / MAX_LIMIT).toFixed(2)}mb
      </p>

      <div className={styles.buttonContainer}>
        <button onClick={HandleData} className={styles.submitButton}>
          Chat
        </button>
      </div>
    </div>
  );
};

export default Upload;
