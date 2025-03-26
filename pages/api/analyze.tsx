import type { NextApiRequest, NextApiResponse } from "next";
import { analyzeDocumentWithAzureOpenAI } from "../../lib/azure-openai";
import { RiskAnalysis } from "../../types";

type ResponseData = RiskAnalysis | { message: string; error?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { text } = req.body as { text: string };

    if (!text) {
      return res.status(400).json({ message: "No document text provided" });
    }

    // Call Azure OpenAI to analyze the document
    const analysisResults = await analyzeDocumentWithAzureOpenAI(text);

    return res.status(200).json(analysisResults);
  } catch (error) {
    console.error("Error in analysis API:", error);
    return res.status(500).json({
      message: "Error analyzing document",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
