import Joi from "joi";

export const FileSchema: Joi.ObjectSchema = Joi.object({
  type: Joi.string()
    .min(1)
    .max(255)
    .required(),
  fileName: Joi.string()
    .min(1)
    .max(255)
    .required(),
});
