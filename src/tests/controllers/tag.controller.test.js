const express = require("express");
const request = require("supertest");
const { StatusCodes } = require("http-status-codes");
const tagController = require("../../controllers/tag.controller");

// Mock tagService directly
jest.mock("../../services/tag.service", () => ({
    createTag: jest.fn().mockResolvedValue({ name: "Technology", createdAt: new Date() }),
    getTags: jest.fn().mockResolvedValue({
        tags: [{ name: "Technology", createdAt: new Date() }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
    })
}));

describe("Tag Controller", () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        // Explicitly define routes here
        app.post("/v1/tag/create", tagController.createTag);
        app.get("/v1/tag/list", tagController.getTagList);
    });

    test("POST /tags should create a tag successfully", async () => {
        const res = await request(app)
            .post("/v1/tag/create")
            .send({ name: "Technology" });

        expect(res.statusCode).toBe(StatusCodes.CREATED);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("name", "Technology");
    });

    test("GET /tags should return a list of tags", async () => {
        const res = await request(app).get("/v1/tag/list");

        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data.tags).toHaveLength(1);
    });
});
