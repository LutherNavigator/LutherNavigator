/**
 * Services for the post vote table.
 * @packageDocumentation
 */

import { BaseService, getTime } from "./util";
import { User } from "./user";
import { Post } from "./post";

/**
 * Post vote architecture.
 */
export interface PostVote {
  id: number;
  userID: string;
  postID: string;
  createTime: number;
}

/**
 * Post vote services
 */
export class PostVoteService extends BaseService {}
