import { z } from "zod";

const toolSchemas = {
  checkTicketAvilabilty: {
    name: "checkTicketAvilabilty",
    description: "Check ticket availability for a givven show id",
    schema: z.object({
      showId: z
        .string()
        .describe("The city or location to get the weather for"),
    }),
  },
  getShows: {
    name: "getShows",
    description:
      "List shows filtered by optional query params: movieId, theaterId, date (YYYY-MM-DD).",
    schema: z.object({
      movieId: z.string().optional().describe("Movie id (number)"),
      movieName: z.string().optional().describe("Movie name (string)"),
      theaterId: z.string().optional().describe("Theater id number"),
      date: z.string().optional().describe("Date filter in YYYY-MM-DD format"),
    }),
  },
  lockSeat: {
    name: "lockSeat",
    description: "Lock specific seats for a given show ID before booking. It",
    schema: z.object({
      showId: z.string().describe("The show ID for which to lock seats"),
      seatIds: z
        .array(z.string())
        .describe("List of seat IDs to be locked for the show"),
    }),
  },
  trimResponse: {
    name: "trimResponse",
    description:
      "Trim an agent/tool result's responseData according to result.metaData.sliceIndex and result.metaData.isArray. Returns the (possibly) modified result.",
    schema: z.object({
      result: z
        .object({
          metaData: z
            .object({
              sliceIndex: z
                .number()
                .int()
                .positive()
                .optional()
                .describe("Number of items to keep"),
              isArray: z
                .boolean()
                .optional()
                .describe("Whether responseData is an array"),
            })
            .optional(),
          responseData: z.any().optional(),
        })
        .optional(),
    }),
  },
  bookTicket: {
    name: "bookTicket",
    description:
      "Book tickets for a show. Input: lockId (string), showId (string|number), seatIds (array of ids). userId. (string|number)",
    schema: z.object({
      lockId: z.string().describe("Lock ID returned from lockSeats"),
      showId: z.union([z.string(), z.number()]).describe("Show ID"),
      seatIds: z
        .array(z.union([z.string(), z.number()]))
        .min(1)
        .describe("Array of seat IDs to book"),
      userId: z.union([z.string(), z.number()]).describe(" user id"),
    }),
  },
  getCurrentTime: {
    name: "getCurrentTime",
    description:
      "Return the current date and time in ISO 8601 format. Useful when the agent needs to know the present date, year, or time.",
    schema: z.object({}),
  },
};

export default toolSchemas;
