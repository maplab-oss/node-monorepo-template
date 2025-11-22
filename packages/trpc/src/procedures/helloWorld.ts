import { message } from "@maplab-oss/helloworld-config";
import { t } from "../instance";

export const helloWorld = t.procedure.query(() => {
  return { message };
});
