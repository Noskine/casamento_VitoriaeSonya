// @ts-check
import { module } from "@prisma/composer";
import appService from "./service.mjs";

export default module("casamento-vitoriaesonya", ({ provision }) => {
  provision(appService);
});
