import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Tesseract from "tesseract.js";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

// Set the workerSrc to use the pdfjs-dist worker from a CDN
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js`;

function FileUploader() {
  const [textContent, setTextContent] = useState("");

  const formik = useFormik({
    initialValues: {
      file: null,
    },
    validationSchema: Yup.object({
      file: Yup.mixed().required("A file is required"),
    }),
    onSubmit: async (values) => {
      const file = values.file;
      if (file) {
        const fileType = file.type;

        if (fileType.startsWith("image/")) {
          // Process image with Tesseract
          Tesseract.recognize(file, "eng")
            .then(({ data: { text } }) => setTextContent(text))
            .catch((err) => console.error(err));
        } else if (fileType === "application/pdf") {
          // Process PDF with pdfjs-dist
          const pdf = await getDocument(URL.createObjectURL(file)).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            text += textContent.items.map((item) => item.str).join(" ");
          }
          setTextContent(text);
        }
      }
    },
  });

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={formik.handleSubmit}>
        <label
          htmlFor="file"
          className="block text-sm font-medium text-gray-700"
        >
          Upload an Image or PDF
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept="image/*,application/pdf"
          onChange={(event) =>
            formik.setFieldValue("file", event.currentTarget.files[0])
          }
          className="mt-1 p-2 border rounded w-full"
        />
        {formik.errors.file ? (
          <div className="text-red-500 text-sm">{formik.errors.file}</div>
        ) : null}

        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Extract Text
        </button>
      </form>

      <div className="mt-6">
        <h3 className="text-lg font-semibold">Extracted Content:</h3>
        <p className="mt-2 text-gray-700 whitespace-pre-line">{textContent}</p>
      </div>
    </div>
  );
}

export default FileUploader;
