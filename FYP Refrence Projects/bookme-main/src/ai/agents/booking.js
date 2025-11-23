import models from "../models/index.js";
import tools from "../tools/index.js";
import _ from "lodash";

let messages = [
  {
    role: "system",
    content:
      "You are a booking agent. Think step-by-step, use tools when needed, and return a final actionable answer. Before computing the current year for any date-based logic, call the currentTime tool and use its value. You need to pass dates in various tool calls",
  },
];

const trimResponse = (result) => {
  if (result.metaData) {
    const { responseData } = result;
    if (!_.isEmpty(responseData)) {
      const { sliceIndex, isArray } = result.metaData;
      if (isArray) {
        const optimalResult = responseData.slice(0, sliceIndex);
        return optimalResult;
      }
    }
  }
  return result;
};

class BookingAgent {
  constructor() {
    if (!this.model) {
      this.model = models.openAI.bindTools([
        tools.bookingTools.lockSeat,
        tools.bookingTools.checkTicketAvilabilty,
        tools.bookingTools.getShows,
        tools.bookingTools.trimResponse,
        tools.bookingTools.bookTicket,
        tools.bookingTools.getCurrentTime,
      ]);
    }
  }

  async callModel(initialPrompt, options = {}) {
    messages.push({ role: "user", content: initialPrompt });
    const results = [];
    const maxIterations = 10;
    let iteration = 0;
    if (options.userId) {
      messages[1].content += ` The user ID is ${options.userId}.`;
    }

    while (iteration < maxIterations) {
      const response = await this.model.invoke(messages, options);

      if (!response.tool_calls?.length && response.content) {
        // If no tool calls, return final content
        results.push({
          finalResponse: response.content,
          isTextContentResponse: true,
        });
        break;
      }

      const toolCalls = response.tool_calls || [];
      const toolResults = [];
      for (const call of toolCalls) {
        const input = call.args || {};
        const functionName = call.name;
        const fn = tools.bookingTools[functionName];

        if (!fn) {
          throw new Error(`Unknown tool: ${functionName}`);
        }

        const funResult = await fn.invoke(input);
        const result = trimResponse(funResult);
        toolResults.push(result);

        messages.push({
          role: "assistant",
          content: null,
          tool_calls: [call],
        });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      iteration++;
      if (messages.length > 30) {
        messages = [messages[0], ...messages.slice(-5)];
      }
    }

    if (iteration === maxIterations) {
      throw new Error("Max iterations reached; task may be too complex.");
    }

    return results;
  }

  async getFormattedResponse(schema, data) {
    const responseWithStructure = this.model.withStructuredOutput(schema);
    try {
      const formattedResult = await responseWithStructure.invoke(data.result);
      return formattedResult;
    } catch (error) {
      console.log(error);
    }
  }
}

export default new BookingAgent();
