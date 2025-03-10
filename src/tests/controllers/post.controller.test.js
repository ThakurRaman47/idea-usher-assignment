const httpMocks = require("node-mocks-http");
const postController = require("../../controllers/post.controller");
const postService = require("../../services/post.service");
const responseHandler = require("../../utils/response-handler");
const { StatusCodes } = require("http-status-codes");
const { successMessages, errorMessages } = require("../../utils/message");

jest.mock("../../services/post.service");
jest.mock("../../utils/response-handler");

describe("Post Controller", () => {
    let req, res;
    
    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
    });

    describe("createPost", () => {
        it("should create a post successfully", async () => {
            req.body = { title: "Test Post", description: "Test Desc", image: "test.jpg", tags: ["tag1"] };
            req.file = { key: "test-key" };

            const mockPost = { title: "Test Post", desc: "Test Desc", imageKey: "test-key", tags: ["tag1"] };
            postService.getTagIds.mockResolvedValue(["tagId1"]);
            postService.createPost.mockResolvedValue(mockPost);

            await postController.createPost(req, res);

            expect(postService.getTagIds).toHaveBeenCalledWith(["tag1"]);
            expect(postService.createPost).toHaveBeenCalledWith({ title: "Test Post", description: "Test Desc", image: "test.jpg", tags: ["tagId1"], image: "test-key" }, ["tag1"]);
            expect(responseHandler.sendSuccessResponseWithData).toHaveBeenCalledWith(res, StatusCodes.CREATED, successMessages.POST_CREATED, mockPost);
        });

        it("should return error when post creation fails", async () => {
            req.body = { title: "Test Post", description: "Test Desc", image: "test.jpg", tags: ["tag1"] };
            req.file = { key: "test-key" };

            postService.getTagIds.mockResolvedValue(["tagId1"]);
            postService.createPost.mockResolvedValue(null);

            await postController.createPost(req, res);

            expect(responseHandler.sendErrorResponse).toHaveBeenCalledWith(res, StatusCodes.BAD_REQUEST, errorMessages.SOMETHING_WRONG);
        });

        it("should handle internal server errors", async () => {
            req.body = { title: "Test Post", description: "Test Desc", image: "test.jpg", tags: ["tag1"] };
            req.file = { key: "test-key" };

            postService.getTagIds.mockRejectedValue(new Error("Database Error"));

            await postController.createPost(req, res);

            expect(responseHandler.sendErrorResponse).toHaveBeenCalledWith(res, StatusCodes.INTERNAL_SERVER_ERROR, "Database Error");
        });
    });

    describe("getAllPosts", () => {
        it("should fetch all posts successfully", async () => {
            req.query = { page: 1, limit: 10 };
            const mockPosts = { posts: [{ title: "Post 1", desc: "Desc 1" }], total: 1, page: 1 };
            postService.getPosts.mockResolvedValue(mockPosts);

            await postController.getAllPosts(req, res);

            expect(postService.getPosts).toHaveBeenCalledWith({ page: 1, limit: 10, sortBy: undefined, sortOrder: undefined, keyword: undefined, tag: undefined });
            expect(responseHandler.sendSuccessResponseWithData).toHaveBeenCalledWith(res, StatusCodes.OK, successMessages.POST_FETCHED, mockPosts);
        });

        it("should handle errors in fetching posts", async () => {
            req.query = { page: 1, limit: 10 };
            postService.getPosts.mockRejectedValue(new Error("Database Error"));

            await postController.getAllPosts(req, res);

            expect(responseHandler.sendErrorResponse).toHaveBeenCalledWith(res, StatusCodes.INTERNAL_SERVER_ERROR, "Database Error");
        });
    });
});
