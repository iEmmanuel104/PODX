/* eslint-disable @typescript-eslint/no-explicit-any */
import { CreateCallDto } from "../../controllers/dto/createCall.dto";
import { BadRequestError } from "../../utils/customErrors";
import { validationMiddleware } from "../validators.middleware";

describe("validationMiddleware", () => {
    it("should call next with no errors for valid input", async () => {
        const req = {
            body: {
                title: "Test Call",
                description: "Valid description",
                type: "audio",
            },
        } as any;
        const res = {} as any;
        const next = jest.fn();

        const middleware = validationMiddleware(CreateCallDto);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
    });

    it("should call next with BadRequestError for invalid input", async () => {
        const req = { body: { title: "", type: "Short" } } as any;
        const res = {} as any;
        const next = jest.fn();

        const middleware = validationMiddleware(CreateCallDto);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
});
