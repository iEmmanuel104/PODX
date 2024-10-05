
// blog.routes.ts
import express, { Router } from 'express';
import BlogController from '../controllers/blog.controller';
import { adminAuth, AuthenticatedController, basicAuth } from '../middlewares/authMiddleware';
import { uploadMiddleware, UploadType } from '../middlewares/uploadMiddleware';

const router: Router = express.Router();

const upload = uploadMiddleware(UploadType.Array, 'media', 5);

router.route('/')
    .get(BlogController.getAllBlogs)
    .post(
        adminAuth('admin'),
        upload,
        AuthenticatedController(BlogController.createBlog)
    );

router.route('/')
    .patch(
        adminAuth('admin'),
        upload,
        AuthenticatedController(BlogController.updateBlog)
    )
    .delete(basicAuth('access'), AuthenticatedController(BlogController.deleteBlog));

router.get('/info', BlogController.getBlog);    
router.post('/engage', basicAuth('access'), AuthenticatedController(BlogController.engageWithBlog));
router.delete('/blog-comment', adminAuth('admin'), AuthenticatedController(BlogController.deleteActivityComment));
router.get('/activities', BlogController.getBlogActivities);

export default router;