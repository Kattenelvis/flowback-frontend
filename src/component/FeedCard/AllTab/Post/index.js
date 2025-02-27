/**
 * FlowBack was created and project lead by Loke Hagberg. The design was
 * made by Lina Forsberg. Emilio Müller helped constructing Flowback.
 * Astroneatech created the code. It was primarily financed by David
 * Madsen. It is a decision making platform.
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
*/

import './styles.css';
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { Children, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatDate } from "../../../../utils/common";
import Image from "../../../common/Image";
import Profile from "../../../User/Profile";
import CommentBox from "../CommentBox";
import PostComment from "./PostComment";
import ProposalDetails from "../../../../page/Polls/PollResults/ProposalDetails.js"

export default function Post({ poll, addComment, updateComment, deleteComment, likeComment, maxComments, children, readOnlyComments }) {
  let { groupId } = useParams();

  const [replyTo, setReplyTo] = useState(null);
  const [editComment, setEditComment] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));

  const onReplyClick = (id) => {
    // replyTo(null);
    setReplyTo(id);
  }

  const onUpdateComment = (comment) => {
    setEditComment(comment);
  }

  /*
  This algorithm is strange because the input values are a bit weird. 
  The inputs given from each comment is only who it replies to, not what replies it has.
  So this algorithm builds a forest of comment trees where the root node is the 
  first comment that doesn't reply to anyone, and it builds from there. Made by Emil
  */
  const renderComments = (inputComments) => {
    console.log(inputComments, "INPUT COPMMENTS")
    let roots = inputComments.filter((comment) => comment.reply_to === null);
    let replies = inputComments.filter((comment) => comment.reply_to !== null);
    let commentsLeft = replies;
    //The finished rendering of the comments will use this one
    let commentDisplayOrder = roots;
    //How many parent comments a reply has, 0 means root
    let depth = 0;

    while (commentsLeft.size > 0 || depth < 10) {
      depth++;
      replies.forEach(reply => {
        roots.forEach(root => {

          if (reply.reply_to === root.id) {
            //Finds the index in the Array where the reply replied to. 
            const index2 = commentsLeft.findIndex((comment) => comment.id === reply.id);
            commentsLeft.splice(index2, 1)

            const index = commentDisplayOrder.findIndex((comment) => comment.id === reply.reply_to);
            reply.depth = depth;
            //Puts the comments in the correct order
            commentDisplayOrder.splice(index + 1, 0, reply);

          }
        })
      })
      roots = commentDisplayOrder;
      replies = commentsLeft;
    }

    console.log(commentDisplayOrder)
    return commentDisplayOrder?.map((item, index) => {
      if (item.reply_to === null) item.depth = 0;
      return ((!maxComments || index < maxComments) ?
        <PostComment {...item} key={index} readOnly={readOnlyComments}
          onReplyClick={(replyId) => onReplyClick(replyId)}
          onUpdateComment={() => onUpdateComment(item)}
          onDeleteComment={() => deleteComment(item.id)}
          onLikeComment={() => likeComment(item)}>
        </PostComment> : null
      );
    });
  };

  const replies = (comments, comment, depth) => {
    const output = []
    comments.forEach(comment => {
      if (comment.reply_to === comment.id) {

      }
    });
  }



  return (
    <div className="post-view">
      <div className="post-header d-flex justify-content-between">
        <div className="post-body" style={{ "width": "100%" }}>
          {/* <Link to={`/groupdetails/${(poll && poll.group && poll.group.id) ? poll.group.id : groupId}/polldetails/${poll.id}`}>
            {children}
          </Link> */}

          <div className="post-comment-view">
            <div className="post-share"><div> <i className="las la-comment"></i>{poll?.comments_details?.total_comments} Comments

            </div>
            </div>
            {
              !readOnlyComments &&
              <div className="media">
                <Image src={user.image} className="userImage" errImg={'/img/no-photo.jpg'} />
                <div className="media-body">
                  <CommentBox poll={poll} replyTo={replyTo}
                    updateComment={editComment}
                    onInputBlur={() => { setReplyTo(null); setEditComment(null) }}
                    onAddComment={(message) => {
                      if (editComment) {
                        const comment = editComment;
                        comment.comment = message;
                        updateComment(comment);
                      } else {
                        if (addComment && typeof addComment === 'function') {
                          try {
                            console.log('in post add comment', replyTo);
                            addComment(message, poll.id, replyTo)
                          } catch (e) {
                            // print error message
                          }
                        }
                      }
                    }} />
                </div>
              </div>
            }
            <div className="comment-reply">{renderComments(poll && poll.comments_details && poll.comments_details.comments)}</div>
          </div>
          {(poll.top_proposal && poll.type === "event") ?
            <div><h5>Meeting date:</h5>
              {poll.top_proposal?.proposal === "Drop this mission"
                ? "No Meeting"
                : <><h4>{poll.top_proposal?.date?.split('T')[0]}</h4><h4>{poll.top_proposal?.date?.split('T')[1].split(".")[0].split(":")[0]}:{poll.top_proposal?.date?.split('T')[1].split(".")[0].split(":")[1]}</h4></>
              }</div> : null}
        </div>



        {/* // <div className="media post-meida">
          //   <Image src={poll.created_by.image} className="post-user-img" errImg={'/img/no-photo.jpg'} />
          //   <div className="media-body">
          //     <h5 className="user-name">
          //       <Profile id={poll.created_by.id} className='cursor-pointer'>{poll.created_by.first_name || "Test"} {poll.created_by.last_name}</Profile><span>created a post in <br></br> <Link to={`/groupdetails/${poll.group.id}`}> {poll.group.title} </Link> </span>
          //       
          //     </h5>
          //     <div className="post-time">{poll && formatDate(poll.created_at, 'DD/MM/YYYY kk:mm')}</div>
          //     <div className="post-time">{poll && formatDate(poll.end_time, 'DD/MM/YYYY kk:mm')}</div>
          //   </div>

            
          // </div> */}


        <>{/* <div className="post-action dropdown">
          <a
            href="#"
            id="postAction"
            data-bs-toggle="dropdown"
            aria-expanded="true"
          >
            <i className="las la-ellipsis-h"></i>
          </a>
          <ul
            className="dropdown-menu dropdown-menu-end"
            aria-labelledby="postAction"
            id="postDrop"
          >
            <li>
              <a className="dropdown-item" href="#">
                Edit
              </a>
            </li>
            <li>
              <a className="dropdown-item" href="#">
                Share
              </a>
            </li>
            <li>
              <a className="dropdown-item" href="#">
                Tag
              </a>
            </li>
            <li>
              <a className="dropdown-item" href="#">
                Delete
              </a>
            </li>
          </ul>
        </div> */}</>

      </div>


    </div>
  );
}
