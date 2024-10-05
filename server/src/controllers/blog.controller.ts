/* eslint-disable no-undef */

// blog.controller.ts
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import BlogService from '../services/blog.service';
import { BlogStatus, IBlog } from '../models/blog.model';
import { BadRequestError } from '../utils/customErrors';
import CloudinaryClientConfig from '../clients/cloudinary.config';
import HelperUtils from '../utils/helpers';

export default class BlogController {
    static async createBlog(req: AuthenticatedRequest, res: Response) {
        const validatedData = await BlogService.validateBlogData(req.body);
        const {
            title,
            content,
            author,
            tags,
            media,
        } = validatedData;

        let images = media?.images ?? [];
        let videos = media?.videos ?? [];

        // Handle file uploads if present
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        if (files) {
            if (files.images) {
                const imageResults = await Promise.all(files.images.map(file =>
                    CloudinaryClientConfig.uploadtoCloudinary({
                        fileBuffer: file.buffer,
                        id: HelperUtils.generateRandomString(8),
                        name: file.originalname,
                        type: 'blog/image',
                    })
                ));
                images = imageResults.map(result => result.url as string);
            }

            if (files.videos) {
                const videoResults = await Promise.all(files.videos.map(file =>
                    CloudinaryClientConfig.uploadtoCloudinary({
                        fileBuffer: file.buffer,
                        id: HelperUtils.generateRandomString(8),
                        name: file.originalname,
                        type: 'blog/video',
                    })
                ));
                videos = videoResults.map(result => result.url as string);
            }
        }

        const blogData: IBlog = {
            title,
            content,
            author,
            tags,
            media: {
                images,
                videos,
            },
        };

        const newBlog = await BlogService.createBlog(blogData);

        res.status(201).json({
            status: 'success',
            message: 'Blog created successfully',
            data: newBlog,
        });
    }

    static async updateBlog(req: AuthenticatedRequest, res: Response) {
        const { id } = req.query;

        if (!id) {
            throw new BadRequestError('Blog ID is required');
        }

        const blog = await BlogService.getBlog(id as string);

        const validatedData = await BlogService.validateBlogData(req.body, id as string, true);
        const {
            title,
            content,
            author,

            
            tags,
            media,
            status,
        } = validatedData;

        let images = media?.images ?? blog.media.images ?? [];
        let videos = media?.videos ?? blog.media.videos ?? [];

        // Handle file uploads if present
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        if (files) {
            if (files.images) {
                const imageResults = await Promise.all(files.images.map(file =>
                    CloudinaryClientConfig.uploadtoCloudinary({
                        fileBuffer: file.buffer,
                        id: HelperUtils.generateRandomString(8),
                        name: file.originalname,
                        type: 'blog/image',
                    })
                ));
                images = [...images, ...imageResults.map(result => result.url as string)];
            }

            if (files.videos) {
                const videoResults = await Promise.all(files.videos.map(file =>
                    CloudinaryClientConfig.uploadtoCloudinary({
                        fileBuffer: file.buffer,
                        id: HelperUtils.generateRandomString(8),
                        name: file.originalname,
                        type: 'blog/video',
                    })
                ));
                videos = [...videos, ...videoResults.map(result => result.url as string)];
            }
        }

        const dataToUpdate: Partial<IBlog> = {
            ...(title && { title }),
            ...(content && { content }),
            ...(author && { author }),
            ...(tags && { tags }),
            ...(status && { status }),
            media: {
                images,
                videos,
            },
        };

        const updatedBlog = await BlogService.updateBlog(blog, dataToUpdate);
        res.status(200).json({
            status: 'success',
            message: 'Blog updated successfully',
            data: updatedBlog,
        });
    }

    static async deleteBlog(req: AuthenticatedRequest, res: Response) {
        const { id } = req.query;

        await BlogService.deleteBlog(id as string);

        res.status(200).json({
            status: 'success',
            message: 'Blog deleted successfully',
        });
    }

    static async getBlog(req: Request, res: Response) {
        const { id, userId } = req.query;

        const blog = await BlogService.getBlog(id as string, userId as string);

        res.status(200).json({
            status: 'success',
            message: 'Blog retrieved successfully',
            data: blog,
        });
    }

    static async getAllBlogs(req: Request, res: Response) {
        const { page, size, status, q, tag, userId } = req.query;

        const blogs = await BlogService.getAllBlogs({
            page: page ? parseInt(page as string) : undefined,
            size: size ? parseInt(size as string) : undefined,
            status: status as BlogStatus,
            q: q as string,
            tag: tag as string,
            userId: userId as string,
        });

        res.status(200).json({
            status: 'success',
            message: 'Blogs retrieved successfully',
            data: blogs,
        });
    }

    static async engageWithBlog(req: AuthenticatedRequest, res: Response) {
        const { id: blogId } = req.query;
        const { action, comment } = req.body;
        const userId = req.user.id;

        const activity = await BlogService.engageWithBlog(blogId as string, userId, action, comment);

        let message: string;
        if (action === 'like') {
            message = activity.liked ? 'Blog liked successfully' : 'Blog unliked successfully';
        } else if (action === 'comment') {
            message = 'Comment added successfully';
        } else {
            message = 'Engagement successful';
        }

        res.status(200).json({
            status: 'success',
            message,
            data: activity,
        });
    }

    static async deleteActivityComment(req: AuthenticatedRequest, res: Response) {
        const { id: activityId } = req.query;
        const userId = req.user.id;
        const isAdmin = req.headers['x-iadmin-access'] === 'true';

        await BlogService.deleteActivity(activityId as string, userId, isAdmin);

        res.status(200).json({
            status: 'success',
            message: 'Activity deleted successfully',
            data: null,
        });
    }

    static async getBlogActivities(req: Request, res: Response) {
        const { id: blogId, type } = req.query;

        const activities = await BlogService.getBlogActivities(blogId as string, type as 'like' | 'comment');

        res.status(200).json({
            status: 'success',
            message: 'Blog activities retrieved successfully',
            data: activities,
        });
    }
}
