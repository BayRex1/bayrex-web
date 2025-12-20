import sendReport from './send_report.js';
import loadReports from './load_reports.js';
import updateReport from './update_report.js';
import { loadComments } from './load_comments.js';
import { loadPosts } from './load_posts.js';
import { deletePost } from './delete_post.js';
import { deleteComment } from './delete_comment.js';
import applyPunishment from './apply_punishment.js';
import getUserPermissions from './get_user_permissions.js';
import updateUserPermissions from './update_user_permissions.js';
import loadMyReports from './load_my_reports.js';
import loadModerationHistory from './load_moderation_history.js';
import loadDashboardStats from './load_dashboard_stats.js';

export default {
    send_report: sendReport,
    load_reports: loadReports,
    update_report: updateReport,
    load_comments: loadComments,
    load_posts: loadPosts,
    delete_post: deletePost,
    delete_comment: deleteComment,
    apply_punishment: applyPunishment,
    get_user_permissions: getUserPermissions,
    update_user_permissions: updateUserPermissions,
    load_my_reports: loadMyReports,
    load_history: loadModerationHistory,
    dashboard_stats: loadDashboardStats
};
