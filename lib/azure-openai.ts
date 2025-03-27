import { RiskAnalysis } from "../types";

export async function analyzeDocumentWithAzureOpenAI(
  documentText: string,
): Promise<RiskAnalysis> {
  const AZURE_OPENAI_ENDPOINT = process.env.NEXT_AZURE_OPENAI_ENDPOINT;
  const AZURE_OPENAI_KEY = process.env.NEXT_AZURE_OPENAI_KEY;
  const AZURE_OPENAI_DEPLOYMENT = process.env.NEXT_AZURE_OPENAI_DEPLOYMENT;
  const AZURE_OPENAI_VERSION = process.env.NEXT_AZURE_OPENAI_VERSION;

  // Check if all required environment variables are defined
  if (
    !AZURE_OPENAI_ENDPOINT ||
    !AZURE_OPENAI_KEY ||
    !AZURE_OPENAI_DEPLOYMENT ||
    !AZURE_OPENAI_VERSION
  ) {
    console.error(
      "Missing Azure OpenAI configuration. Please set all required environment variables."
    );
    throw "missing openai config";
  }

  try {
    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_VERSION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_OPENAI_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are an AI assistant that analyzes documents for potential risks. Identify statements that could represent legal, financial, or operational risks. For each risk, provide the statement, risk factor, severity (Low, Medium, High), and a suggestion for improvement. 

Also identify which specific clause section from the rules provided is related to each risk, and provide a suggested rewrite of the problematic statement.

Return your response as a JSON object with a "risks" array containing objects with the following fields:
- "statement": the problematic text from the document
- "factor": description of the risk 
- "severity": "Low", "Medium", or "High"
- "suggestion": general suggestion for improvement
- "clause": the number of the relevant clause from the rules (e.g., "5" or "13")
- "clauseSection": the title of that clause section (e.g., "Termination" or "Obligations of Recipient")
- "rewrite": a specific rewrite of the problematic statement that addresses the risk which should be a complete replacement of the problematic text from the document (statement field in the output)

Please consider the below JSON as rules in doing this task: 
\`\`\`json
{
  "title": "Mutual Non Disclosure Agreement",
  "clauses": [
    {
      "sNo": "1",
      "clauseSection": "Defined terms",
      "necessaryInclusions": "The agreement should clearly define who shall be termed as receiving party/recepient and disclosing party. The Parties obligations under the NDA shall extend to their subsidiaries and affiliates, and each of their respective directors, officers, employees, representatives and agents. (can be referred to as \\"Representatives\\")",
      "riskFactors": {
        "low": "",
        "moderate": "",
        "high": ""
      },
      "suggestions": ""
    },
    {
      "sNo": "1",
      "clauseSection": "Purpose",
      "necessaryInclusions": "1. A generally defined purpose of the mutual non disclosure agreement i.e., to entre into a business relationship with each other\\n\\n2. In order to entre into business with each other, parties are desrious of getting into negotiations to arrive at a definite business relationship.\\n\\n3. To mutually exchange Confidential Information as defined.",
      "riskFactors": {
        "low": "1. A unilateral NDA.\\n\\n2. A specifically defined purpose i.e., the exact reason behind entering into an NDA. For e.g., to exchange doncumets only.",
        "moderate": "",
        "high": ""
      },
      "suggestions": "1. Not to accept unilateral NDA; suggest to make clauses mutual wherever necessary\\n\\n2. Analyse whether purpose is clearly defined.\\n\\n3. Analyses, in case the langauge is not generic in nature."
    },
    {
      "sNo": "2",
      "clauseSection": "Definition of Confidential Information",
      "necessaryInclusions": "1. The obligation to protect confidential information shall extend to Recevving Party, including its subsidiaries and affiliates, and each of their respective directors, officers, employees, representatives and agents (collectively, \\"Recipient's Representatives\\")\\n\\n2. Confidential Information, for the purpose of NDA can be disclosed by Disclosing Party and its affiliated companies, relating to the Disclosing Party, its subsidiaries or affiliates or their respective businesses.\\n\\n3. Confidential Information can be communicated in writing, orally, electronically, photographically, or recorded in any other form of media\\n\\n4. The scope of Confidential Information shall include, but not be limited to, information in electronic form, sales and operating information, platform information, underwriting methodologies or other business processes, client lists and other client information, employee and other human resource information, analyses, compilations, forecasts, studies, notes or other documents shared, existing and potential business and marketing plans and strategies, financial information, financial turnover and revenue information, cost and pricing information, data media, know-how, designs, drawings, specifications, software, source codes, technical information, concepts, reports, methods, processes, techniques, operations, devices, and the like, whether or not the foregoing information is patented, tested, reduced to practice, or subject to copyright or any other intellectual property right.",
      "riskFactors": {
        "low": "",
        "moderate": "Only information marked as \\"confidential\\" will be deemed as confidential information",
        "high": "Confidential information does not contain: source code"
      },
      "suggestions": "Suggest a broader definition of \\"confidential information\\", one that includes any information that is disclosed orally(and made into writing within 7 days from the date of disclosure) or in writing shall be deemed as confidential information."
    },
    {
      "sNo": "3",
      "clauseSection": "general exceptions",
      "necessaryInclusions": "The confidentiality obligations shall not apply to Confidential Information which:  \\na. was in the public domain or generally available to the public prior to receipt thereof by Receiving Party from the Disclosing Party, or which subsequently becomes part of the public domain or generally available to the public through no act, fault, breach or omission on the part of the Receiving Party; \\nb. was in the possession of Receiving Party prior to receipt from the Disclosing Party;\\nc. is  later  lawfully  received  by  Receiving  Party  from  a  third  party  without any confidentiality restrictions applicable; \\nd. is  independently  created  or  developed  by  the  Receiving  Party  without use  or  reference  of the Confidential Information of the Disclosing Party; or,\\ne. is required to be disclosed by operation of applicable law.",
      "riskFactors": {
        "low": "",
        "moderate": "Does not contain any of the exclusions provided under the necessary inclusions",
        "high": ""
      },
      "suggestions": ""
    },
    {
      "sNo": "4",
      "clauseSection": "Scope",
      "necessaryInclusions": "The protection of Confidential Information must exetent to information disclosed by disclosing party on and subsequent to the date of the Agreement",
      "riskFactors": {
        "low": "",
        "moderate": "",
        "high": ""
      },
      "suggestions": ""
    },
    {
      "sNo": "5",
      "clauseSection": "Obligations of Recipient",
      "necessaryInclusions": "Once the Confidential Information is disclosed, the receiving party must adhere to the following\\n1. Strict standard of care - to hold Confidential Information in strict confidence, with at least the same degree of care the recipient party uses for its own proprietary information, and no less than a reasonable degree of care.\\n\\n2. Prohibition of disclosure without consent- the receiving party cannot disclose Confidential Information to any person without prior written consent from the Disclosing Party.\\n\\n3. Obligation for Representatives - it shall be the responsibility of the receiving party to ensure that its representatives are bound by confidentiality and it will remain fully liable for breaches caused by such representatives.\\n\\n4. Restriction on disclosure to competitors- A strict prohibition on disclosing Confidential Information to the Disclosing Party's direct and/or indirect competitors.\\n\\n5. Definition of \\"Person\\" - in case the term \\"Person\\" is used in the Agreement, then it shall be broadly interpreted to include, without limitation, any corporation, company, partnership, organization, association, entity or individual.\\n\\n6. Disclosure to Representatives is permitted only on a \\"need-to-know\\" basis and solely for evaluating the stated Purpose, ensuring that access to information is limited and purposeful",
      "riskFactors": {
        "low": "",
        "moderate": "Absence of a degree of care similar to what the recipient party uses to protect its own proprietary information",
        "high": "Contains the following clauses: non-solicitation clause; non-circumvention clause; Indemnity obligations"
      },
      "suggestions": "Suggest removing non-solication clause and non-circumvention clause, if identified. As the purpose of the NDA is only for initial discussions to enter into a potential business arrangement, a non-solication clause or non-circumvention clause is not necessary and restrictive at this initial stage."
    },
    {
      "sNo": "6",
      "clauseSection": "Compelled Disclosures",
      "necessaryInclusions": "1. The recipient must provide prompt written notice to the disclosing party upon receiving any legal or regulatory request to disclose confidential information.\\n2. Should grant the disclosing party sufficient time to seek protective orders or other legal remedies to prevent or limit disclosure of confidential information. 3. Ensure the recipient discloses information only as mandated by law and does not voluntarily provide additional information. 4. Specify that the recipient must comply with legal obligations while minimizing disclosure and safeguarding the confidentiality of the information to the extent possible.",
      "riskFactors": {
        "low": "",
        "moderate": "1. Does not contain restriction to furnish only that portion of the Confidential Information which Recipient is legally compelled to disclose. 2. Does not specify \\"prompt\\" notification. 3. Does not explicitly obligate the recipient to notify the disclosing party or cooperate in seeking protective remedies",
        "high": ""
      },
      "suggestions": ""
    },
    {
      "sNo": "7",
      "clauseSection": "Use of Confidential Information",
      "necessaryInclusions": "Recipient shall not use any Confidential Information for any reason other than as may be necessary for the Purpose. Recipient agrees to make no other use of the Confidential Information or to incorporate any Confidential Information into any work or product.",
      "riskFactors": {
        "low": "",
        "moderate": "",
        "high": "Contains Residual Information Clause"
      },
      "suggestions": "Suggest removing residual information clause"
    },
    {
      "sNo": "8",
      "clauseSection": "No License or Right to Use.",
      "necessaryInclusions": "The Recipient shall not acquire by implication or otherwise any right in or title to or license in respect of the Confidential Information disclosed to it by the Disclosing Party.",
      "riskFactors": {
        "low": "",
        "moderate": "does not explicitly state that the recipient cannot reverse-engineer, replicate, or derive intellectual property from the confidential information",
        "high": "does not prevent the recipient from creating derived works based on the confidential information"
      },
      "suggestions": ""
    },
    {
      "sNo": "9",
      "clauseSection": "Return of Confidential Information",
      "necessaryInclusions": "1. Recipient must return or destroy all confidential information, including physical and electronic formats, within a specified timeframe 7 days upon written request.\\n2. Recipient to retain a single copy of Confidential Information solely for its compliance purposes and maintain confidentiality for the same in perpetuity",
      "riskFactors": {
        "low": "Recipient does not confirm in writing that the confidential information has been destroyed",
        "moderate": "",
        "high": "Does not allow for retention of a copy for compliance purposes"
      },
      "suggestions": ""
    },
    {
      "sNo": "10",
      "clauseSection": "No Warranties",
      "necessaryInclusions": "1. All confidential information is provided \\"as is\\" without any warranties, express or implied. 2. No Guarantee of Accuracy or Completeness; 3. Exclusion of Liability; 4. No implied warranties",
      "riskFactors": {
        "low": "",
        "moderate": "",
        "high": "Contains unlimited liability for breach"
      },
      "suggestions": ""
    },
    {
      "sNo": "11",
      "clauseSection": "No Obligation; No Authority of Agency",
      "necessaryInclusions": "1. No obligation to pursue the purpose or negotiations; 2. No obligation to enter into further agreements; 3. No joint venture or partnership or principal-agent relationship; 4. Any future obligations or commitments would require a separate written agreement; 5. Agreement is non-binding and does not obligate either party to any action unless stated in a subsequent agreement.",
      "riskFactors": {
        "low": "",
        "moderate": "",
        "high": ""
      },
      "suggestions": "1. Contains implied long-term commitments"
    },
    {
      "sNo": "12",
      "clauseSection": "Remedies",
      "necessaryInclusions": "1. Right to seeek equitable or additional - injunction or specific performance; 2. Right to seek for both breach as well as threatened breach; 3. right to interim relief",
      "riskFactors": {
        "low": "Absence of threatened breach",
        "moderate": "",
        "high": "Contains indemnity obligations"
      },
      "suggestions": ""
    },
    {
      "sNo": "13",
      "clauseSection": "Termination",
      "necessaryInclusions": "1. Clear commencement and end date(ex: 1 - 2 years or; till parties enter into a definitive agreement); 2. Survival of confidentiality obligations(2 - 3 years).",
      "riskFactors": {
        "low": "",
        "moderate": "More than 5 years",
        "high": "No specific end date or anything that implices that confidentiality obligations survive in perpetuity."
      },
      "suggestions": ""
    },
    {
      "sNo": "14",
      "clauseSection": "Governing Law & Jurisdiction",
      "necessaryInclusions": "1. Governing Law - India; 2. Jurisdiction - courts of Bengaluru(1st preference), Mumbai(2nd); Delhi & Kolkata(3rd) ; 3. Arbitration as an alternate mode of dispute resolution",
      "riskFactors": {
        "low": "Jurisdiction - Mumbai, Delhi or Kolkata",
        "moderate": "",
        "high": "Any venue other than Bengaluru, Mumbai, Delhi or Kolkata"
      },
      "suggestions": "Suggest for Bengaluru, in case of any other jurisdiction"
    }
  ],
  "excludedClauses": [
    {
      "clause": "Indemnity Clause",
      "argumentsForRemoval": "1. Purpose of NDA is only for initial discussions to check feasibility of a potential business relationship; 2. Undertaking indemnity obligations are too restrictive at this stage; 3. In the event of breach, the parties shall have the right to seek equitable remedies from the court of law; 4. The parties have complete control over what info and how much of such sensitive info they share. Hence, if either party is concerned about potential damages from breach of highly sensitive data, they can choose not to disclose it.",
      "suggestions": ""
    },
    {
      "clause": "Non-Solicitation",
      "argumentsForRemoval": "",
      "suggestions": "Provided however, that the Recipient is not prevented from employing any such person who contacts the Recipient on his or her own initiative and without any direct or indirect solicitation by the Recipient, or in response to a general advertisement."
    },
    {
      "clause": "Non-Circumvention",
      "argumentsForRemoval": "",
      "suggestions": ""
    },
    {
      "clause": "Term Period - Confidentiality Obligations survive in perpetuity",
      "argumentsForRemoval": "",
      "suggestions": ""
    }
  ]
}
\`\`\``
            },
            {
              role: "user",
              content: documentText,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 4096,
        }),
      }
    );

    const data = await response.json();
    console.log(JSON.stringify(data));

    try {
      const risksData : RiskAnalysis = JSON.parse(data.choices[0].message.content);
      
      // Make sure all risks have a rewrite field
      if (risksData.risks) {
        risksData.risks = risksData.risks.map(risk => ({
          ...risk,
          rewrite: risk.rewrite || `${risk.statement} [suggested revision needed]`
        }));
      }
      
      return risksData; // This should be a properly formatted RiskAnalysis object
    } catch (error) {
      console.error("Error parsing Azure OpenAI response:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error calling Azure OpenAI:", error);
    throw error;
  }
}
