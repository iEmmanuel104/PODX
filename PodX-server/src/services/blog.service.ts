/* eslint-disable no-undef */

// blog.service.ts
import { Transaction, Op } from 'sequelize';
import Blog, { IBlog, BlogStatus } from '../models/blog.model';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/customErrors';
import Pagination, { IPaging } from '../utils/pagination';
import BlogActivity, { IBlogActivity } from '../models/blogActivity.model';
import User from '../models/Postgres/user.model';
import sequelize from 'sequelize';

export interface IViewBlogsQuery {
    page?: number;
    size?: number;
    status?: BlogStatus;
    tag?: string;
    userId?: string;
    q?: string;
}

export default class BlogService {
    static async createBlog(blogData: IBlog, transaction?: Transaction): Promise<Blog> {

        const newBlog = await Blog.create({ ...blogData }, { transaction });

        return newBlog;
    }

    static async updateBlog(blog: Blog, dataToUpdate: Partial<IBlog>, transaction?: Transaction): Promise<Blog> {
        await blog.update(dataToUpdate, { transaction });
        const updatedBlog = await this.getBlog(blog.id);
        return updatedBlog;
    }

    static async deleteBlog(id: string, transaction?: Transaction): Promise<void> {
        const blog = await this.getBlog(id);
        await blog.destroy({ transaction });
    }

    static async getBlog(id: string, userId?: string): Promise<Blog> {
        const blog = await Blog.findByPk(
            id,
            {
                include: [{
                    model: BlogActivity,
                    as: 'activities',
                    attributes: ['id', 'comment', 'createdAt'],
                    where: {
                        comment: {
                            [Op.not]: null,
                        },
                    },
                    required: false,
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'firstName', 'lastName', 'email', 'displayImage'],
                    }],
                }],
                attributes: {
                    include: [
                        [
                            sequelize.literal('(SELECT COUNT(*) FROM "BlogActivities" WHERE "BlogActivities"."blogId" = "Blog"."id" AND "BlogActivities"."liked" = true)'),
                            'likesCount',
                        ],
                        [
                            sequelize.literal('(SELECT COUNT(*) FROM "BlogActivities" WHERE "BlogActivities"."blogId" = "Blog"."id" AND "BlogActivities"."comment" IS NOT NULL)'),
                            'commentsCount',
                        ],
                        ...(userId ? [
                            [
                                sequelize.literal(`(SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM "BlogActivities" WHERE "BlogActivities"."blogId" = "Blog"."id" AND "BlogActivities"."userId" = '${userId}' AND "BlogActivities"."comment" IS NOT NULL)`),
                                'userHasCommented',
                            ],
                        ] : []),
                    ] as [sequelize.Utils.Literal, string][],
                },
            }
        );

        if (!blog) {
            throw new NotFoundError('Blog not found');
        }
        return blog;
    }

    static async getAllBlogs(queryData: IViewBlogsQuery): Promise<{ blogs: Blog[], count?: number, totalPages?: number }> {
        const { page, size, status, tag, q: query, userId } = queryData;
        const where: Record<string | symbol, unknown> = {};

        if (query) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${query}%` } },
                { content: { [Op.iLike]: `%${query}%` } },
            ];
        }

        if (status) {
            where.status = status;
        }
        if (tag) {
            where.tags = { [Op.contains]: [tag] };
        }

        let conditions: Record<string, unknown> = {};
        let paginate = false;

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            conditions = { limit, offset };
            paginate = true;
        }

        const { rows: blogs, count } = await Blog.findAndCountAll({
            where,
            ...conditions,
            include: [{
                model: BlogActivity,
                as: 'activities',
                attributes: ['id', 'comment', 'createdAt'],
                where: {
                    comment: {
                        [Op.not]: null,
                    },
                },
                required: false,
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'displayImage'],
                }],
            }],
            order: [['createdAt', 'DESC']],
            attributes: {
                include: [
                    [
                        sequelize.literal('(SELECT COUNT(*) FROM "BlogActivities" WHERE "BlogActivities"."blogId" = "Blog"."id" AND "BlogActivities"."liked" = true)'),
                        'likesCount',
                    ],
                    [
                        sequelize.literal('(SELECT COUNT(*) FROM "BlogActivities" WHERE "BlogActivities"."blogId" = "Blog"."id" AND "BlogActivities"."comment" IS NOT NULL)'),
                        'commentsCount',
                    ],

                    ...(userId ? [
                        [
                            sequelize.literal(`(SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM "BlogActivities" WHERE "BlogActivities"."blogId" = "Blog"."id" AND "BlogActivities"."userId" = '${userId}' AND "BlogActivities"."comment" IS NOT NULL)`),
                            'userHasCommented',
                        ],
                    ] : []),
                ] as [sequelize.Utils.Literal, string][]
            },
        });

        if (paginate && blogs.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { blogs, count, ...totalPages };
        } else return { blogs };
    }

    static async engageWithBlog(blogId: string, userId: string, action: 'like' | 'comment', content?: string): Promise<BlogActivity> {
        await this.getBlog(blogId);

        let activity = await BlogActivity.findOne({ where: { blogId, userId } });

        if (!activity) {
            activity = await BlogActivity.create({ blogId, userId } as IBlogActivity);
        }

        switch (action) {
            case 'like':
                activity.liked = !activity.liked;
                break;
            case 'comment':
                if (!content) {
                    throw new BadRequestError('Content is required for comments');
                }
                if (activity.comment) {
                    throw new ForbiddenError('You are not allowed to edit an existing comment');
                }
                activity.comment = content;
                break;
            default:
                throw new BadRequestError('Invalid action');
        }

        await activity.save();
        return activity;
    }

    static async deleteActivity(activityId: string, userId: string, isAdmin: boolean): Promise<void> {
        const activity = await BlogActivity.findByPk(activityId);
        if (!activity) {
            throw new NotFoundError('Activity not found');
        }
        if (!isAdmin && activity.userId !== userId) {
            throw new ForbiddenError('You are not authorized to delete this activity');
        }
        if (activity.comment) {
            activity.comment = null;
        } else {
            activity.liked = false;
        }
        await activity.save();
    }

    static async getBlogActivities(blogId: string, type?: 'like' | 'comment'): Promise<BlogActivity[]> {
        const where: Record<string, unknown> = { blogId };
        if (type === 'like') {
            where.liked = true;
        } else if (type === 'comment') {
            where.comment = { [Op.not]: null };
        }
        return BlogActivity.findAll({ where });
    }

    static async validateBlogData(data: Partial<IBlog>, id?: string, isUpdate = false): Promise<IBlog> {
        const {
            title,
            content,
            media,
            status,
            tags,
            author,
        } = data;

        if (!isUpdate) {
            if (!title || typeof title !== 'string') {
                throw new BadRequestError('Valid title is required');
            }
            if (!content || typeof content !== 'string') {
                throw new BadRequestError('Valid content is required');
            }
            if (!author || typeof author !== 'object' || !author.name || !author.email) {
                throw new BadRequestError('Valid author information is required');
            }
        }

        // Validate title if provided
        if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
            throw new BadRequestError('Title must be a non-empty string');
        }

        // Validate content if provided
        if (content !== undefined && (typeof content !== 'string' || content.trim().length === 0)) {
            throw new BadRequestError('Content must be a non-empty string');
        }

        // Validate media if provided
        if (media !== undefined) {
            if (typeof media !== 'object') {
                throw new BadRequestError('Media must be an object');
            }
            if (media.images && (!Array.isArray(media.images) || !media.images.every(url => typeof url === 'string'))) {
                throw new BadRequestError('Media images must be an array of strings');
            }
            if (media.videos && (!Array.isArray(media.videos) || !media.videos.every(url => typeof url === 'string'))) {
                throw new BadRequestError('Media videos must be an array of strings');
            }
        }

        // Validate status if provided
        if (status !== undefined && !Object.values(BlogStatus).includes(status)) {
            throw new BadRequestError('Invalid blog status');
        }

        // Validate tags if provided
        if (tags !== undefined && (!Array.isArray(tags) || !tags.every(tag => typeof tag === 'string'))) {
            throw new BadRequestError('Tags must be an array of strings');
        }

        // Validate author if provided
        if (author !== undefined) {
            if (typeof author !== 'object' || !author.name || !author.email) {
                throw new BadRequestError('Author must have a name and email');
            }
            if (author.image !== undefined && typeof author.image !== 'string') {
                throw new BadRequestError('Author image must be a string');
            }
            if (author.bio !== undefined && typeof author.bio !== 'string') {
                throw new BadRequestError('Author bio must be a string');
            }
        }

        // If it's an update, check if the blog exists
        if (isUpdate && id) {
            const existingBlog = await Blog.findByPk(id);
            if (!existingBlog) {
                throw new BadRequestError('Blog not found');
            }
        }

        return data as IBlog;
    }
}
