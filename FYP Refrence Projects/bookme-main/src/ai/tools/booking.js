import { tool } from "@langchain/core/tools";
import bookingController from "../../controllers/booking.controller.js";
import showController from "../../controllers/show.controller.js";
import schemas from "../Schema/index.js";
import * as z from "zod";

const { toolSchemas } = schemas;

const checkTicketAvilabilty = tool(async (input) => {
  const showId = parseInt(input.showId);
  const req = { params: { showId } };
  req.isAIRequest = true;
  const result = await bookingController.checkAvailability(req);
  return result;
}, toolSchemas.checkTicketAvilabilty);

const lockSeat = tool(async (input) => {
  const showId = parseInt(input.showId);
  const seatIds = input.seatIds.map((id) => parseInt(id));

  const req = { body: { showId, seatIds } };
  req.isAIRequest = true;

  const result = await bookingController.lockSeats(req);
  return result;
}, toolSchemas.lockSeat);

const bookTicket = tool(async (input) => {
  const { lockId, showId, seatIds, userId } = input;

  const req = { userId, body: { showId, seatIds, lockId } };
  req.isAIRequest = true;

  const result = await bookingController.bookTicket(req);
  return result;
}, toolSchemas.bookTicket);

const getShows = tool(async (input) => {
  const req = { query: input };
  req.isAIRequest = true;
  const result = await showController.get(req);
  return result;
}, toolSchemas.getShows);

const getCurrentTime = tool(async () => {
  return new Date().toISOString();
}, toolSchemas.getCurrentTime);

const trimResponse = tool(async (input) => {
  const { result } = input || {};

  if (!result || typeof result !== "object") return result;

  const meta = result.metaData;
  const data = result.responseData;

  if (!meta || data == null) return result;

  const sliceIndex =
    typeof meta.sliceIndex === "number" && meta.sliceIndex > 0
      ? Math.floor(meta.sliceIndex)
      : null;
  const isArrayFlag = !!meta.isArray;

  if (Array.isArray(data) && sliceIndex) {
    const trimmed = data.slice(0, sliceIndex);
    return { ...result, responseData: trimmed };
  }

  if (!isArrayFlag && Array.isArray(data)) {
    return { ...result, responseData: data.length ? data[0] : null };
  }

  return result;
}, toolSchemas.trimResponse);

const bookingTools = {
  checkTicketAvilabilty,
  lockSeat,
  getShows,
  trimResponse,
  bookTicket,
  getCurrentTime,
};
export default bookingTools;
