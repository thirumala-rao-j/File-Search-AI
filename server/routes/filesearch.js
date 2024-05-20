const express = require("express");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let foldername = "";
let folderpath = "";

// Configure Multer storage to preserve original file name and extension
function generateRandomString(length) {
  return require("crypto").randomBytes(length).toString("hex");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    foldername = foldername === "" ? generateRandomString(16) : foldername;
    folderpath = path.join(process.cwd(), "uploads", foldername);

    fs.mkdir(folderpath, { recursive: true }, (err) => {
      if (err) {
        return console.error(`Error creating directory: ${err.message}`);
      }
      console.log("Directory created successfully!");
      cb(null, `uploads/${foldername}`);
    });
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and doc files are allowed!"), false);
    }
  },
});

router.route("/").get((req, res) => {
  res.status(200).json({
    message: "Hello from file search routes",
  });
});

// creating vector store
router.route("/store").post(upload.array("pdfFiles"), async (req, res) => {
  const files = req.files;

  try {
    const paths = files.map((file) => file.path);

    // Create file streams
    const fileStreams = paths.map((filePath) => {
      return fs.createReadStream(path.resolve(filePath));
    });

    // Create a vector store
    let vectorStore = await openai.beta.vectorStores.create({
      name: "User Data",
      expires_after: {
        anchor: "last_active_at",
        days: 1,
      },
    });

    // Upload and poll the file batches
    await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, {
      files: fileStreams,
    });

    // delete uploaded files
    fs.rm(folderpath, { recursive: true, force: true }, (err) => {
      if (err) {
        return console.error(`Error removing directory: ${err.message}`);
      }
      console.log("Directory removed successfully!");
    });

    res.status(201).json({ status: "success", data: vectorStore });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
});

// Running a thread
router.route("/upload").post(async (req, res) => {
  const { prompt, vector_id } = req.body;

  await openai.beta.assistants.update(process.env.OPENAI_ASSISTANT, {
    tool_resources: {
      file_search: { vector_store_ids: [vector_id] },
    },
  });

  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const stream = openai.beta.threads.runs
    .stream(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT,
    })
    .on("textCreated", () => console.log("assistant >"))
    .on("toolCallCreated", (event) => console.log("assistant " + event.type))
    .on("messageDone", async (event) => {
      if (event.content[0].type === "text") {
        let { text } = event.content[0];

        // Remove annotations from text
        const cleanText = text.value.replace(/\[\d+\]/g, "");

        res.status(200).json({ data: cleanText });
      }
    });
});

module.exports = router;
