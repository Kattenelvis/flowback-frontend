/**
 * FlowBack was created and project lead by Loke Hagberg. The design was
 * made by Lina Forsberg. Emilio MÃ¼ller helped constructing Flowback.
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

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { postRequest, getRequest, getJsonRequest } from '../../../utils/API';
import CounterProposal from './CounterProposal';
import { faSort, faArrowsAltV, faFileAlt } from '@fortawesome/free-solid-svg-icons'
import { FormatComments } from '../../../utils/common';
import SortCounterProposal from './SortCounterProposal';
import './styles.css';
import { UserTypes } from '../../../constants/constants';

function Counterproposals({ poll, group, setAlreadyPosted }) {

    const [counterProposals, setCounterProposals] = useState([]);
    const [proposalIndexes, setProposalIndexes] = useState(null);
    const [scores, setScores] = useState([]);

    useEffect(() => {
        getCounterProposals();
    }, [])

    /**
     * To get counter proposals
     */
    const getCounterProposals = () => {
        //var data = new FormData();
        //data.append('poll', poll.id);
        getRequest(`api/v1/group_poll/${poll.id}/all_proposals`).then(
            (response) => {
                if (response.detail !== "Not found.") {

                    response.forEach(proposal => {
                        if (proposal.user?.id === JSON.parse(localStorage.getItem("user")).id) {
                            setAlreadyPosted(true);
                            //TODO: User should be able to get feedback
                            console.log("POSTED ALREADY")
                            return null;
                        }
                    });
                    console.log('response', response);
                    //const { status, data } = response;
                    //if (response === "success") {
                    console.log("the counter proposasls", response)
                    setCounterProposals(response)
                    // if (response && response.counter_proposals) {
                    //     response.forEach((counterProposal) => {
                    //         counterProposal.comments_details.comments = FormatComments(counterProposal.comments_details.comments);
                    //         setCounterProposals(response);
                    //     })
                    // }
                    //}
                }
                else {
                    console.log("No proposals");
                }
            });
        getRequest(`api/v1/group_poll/${poll.id}/index_proposals`).then(
            (response) => {
                if (response && response.proposal_indexes) {
                    setProposalIndexes(response.proposal_indexes);
                    if (poll.voting_type === "cardinal") {
                        setScores(response.score);
                    }
                }
            });
    }

    /**
     * To add comment in counter proposal
     * @param {*} message
     * @param {*} counterProposalId
     * @param {*} replyTo
     */
    const addComment = (message, counterProposalId, replyTo) => {
        var data = {
            counter_proposal: counterProposalId,
            comment: message
        }
        if (replyTo) {
            data.reply_to = replyTo;
        }
        console.log("data:", data)
        postRequest("api/v1/group_poll/create_counter_proposal_comment", data).then(
            (response) => {
                console.log('response', response);
                if (response) {
                    const { status, data } = response;
                    if (status == "success") {
                        console.log('counterproposalsdup data', data);
                        let counterProposalsDup = counterProposals.slice();
                        const index = counterProposalsDup.findIndex((counterProposal) => counterProposal.id === data.id);
                        data.comments_details.comments = FormatComments(data.comments_details.comments);
                        counterProposalsDup.splice(index, 1, data);
                        setCounterProposals(counterProposalsDup);
                        // counterproposalsdup?.map((poll, index) => {
                        //     if (poll.id == data.id) {
                        //         counterProposalsDup.splice(index, 1, data);
                        //         setCounterProposals([...counterProposalsDup]);
                        //     }
                        // })
                    }
                }

            }
        );
    }

    /**
     * To update a comment
     */
    const updateComment = (comment) => {
        var data = {
            comment_id: comment.id,
            comment: comment.comment
        }
        console.log("data:", data)
        postRequest("api/v1/group_poll/edit_counter_proposal_comment", data).then(
            (response) => {
                console.log('response', response);
                if (response) {
                    const { status, data } = response;
                    if (status == "success") {
                        console.log('counterproposalsdup data', data);
                        let counterProposalsDup = counterProposals.slice();
                        const index = counterProposalsDup.findIndex((poll) => poll.id === data.id);
                        data.comments_details.comments = FormatComments(data.comments_details.comments);
                        counterProposalsDup.splice(index, 1, data);
                        setCounterProposals(counterProposalsDup);
                    }
                }

            }
        );
    }

    /**
     * To like a comment
     * @param {*} comment
     */
    const likeComment = (comment) => {
        var data = {
            counter_proposal_comment: comment.id,
            like: !comment.liked
        }
        console.log("data:", data)
        postRequest("api/v1/group_poll/like_dislike_counter_proposal_comment", data).then(
            (response) => {
                console.log('response', response);
                if (response) {
                    const { status, data } = response;
                    if (status == "success") {
                        console.log('counterproposalsdup data', data);
                        let counterProposalsDup = counterProposals.slice();
                        const index = counterProposalsDup.findIndex((poll) => poll.id === data.id);
                        data.comments_details.comments = FormatComments(data.comments_details.comments);
                        counterProposalsDup.splice(index, 1, data);
                        setCounterProposals(counterProposalsDup);
                    }
                }

            }
        );
    }

    /**
     * To delete a comment
     * @param {*} commentId
     */
    const deleteComment = (commentId) => {
        var data = {
            comment: commentId
        }
        console.log("data:", data)
        postRequest("api/v1/group_poll/delete_counter_proposal_comment", data).then(
            (response) => {
                console.log('response', response);
                if (response) {
                    const { status, data } = response;
                    if (status == "success") {
                        console.log('counterproposalsdup data', data);
                        let counterProposalsDup = counterProposals.slice();
                        const index = counterProposalsDup.findIndex((counterProposal) => counterProposal.id === data.id);
                        data.comments_details.comments = FormatComments(data.comments_details.comments);
                        counterProposalsDup.splice(index, 1, data);
                        setCounterProposals(counterProposalsDup);
                    }
                }
            }
        );
    }

    const onUpdateIndexes = (reload) => {
        if (reload) {
            getCounterProposals();
        }
    }

    return (
        <div>
            <div className="card poll-details-card card-rounded overflow-hidden my-4">
                <div className="card-header">
                    {/* <div className="card-header flex-header d-flex justify-content-between"> */}
                    {/* <h4 className="card-title fw-bolder">Proposals</h4> */}
                    {
                        (counterProposals?.length && poll?.discussion !== 'Finished' && group && group.user_type) ?
                            <SortCounterProposal pollId={poll.id}
                                counterProposals={counterProposals}
                                proposalIndexes={proposalIndexes}
                                onUpdateIndexes={() => null}
                                votingType={poll.voting_type}
                                scores={poll.voting_type === "cardinal" ? scores : null}
                            >
                                <FontAwesomeIcon icon={faArrowsAltV} color="black" />
                            </SortCounterProposal>
                            : null
                    }
                </div>
                <div className="card-body overflow-hidden">
                    {
                        !counterProposals?.length || counterProposals.detail === "Not found." ?
                            <div className='text-center'>No proposals are available.</div>
                            : null
                    }
                    {typeof (counterProposals) === Array && counterProposals.detail !== "Not found." ? counterProposals?.map((counterProposal, index) => (
                        <CounterProposal counterProposal={counterProposal} key={counterProposal.id}
                            addComment={(message, pollId, replyTo) => addComment(message, counterProposal.id, replyTo)}
                            updateComment={(comment) => updateComment(comment)}
                            deleteComment={(commentId) => deleteComment(commentId)}
                            likeComment={(comment) => likeComment(comment)}
                            readOnlyComments={poll.discussion === "Finished" || !(group && group.user_type && group.user_type !== UserTypes.Delegator)}
                        >
                            <>
                                <div className='d-flex'>
                                    <FontAwesomeIcon className='counter-proposal-file' icon={faFileAlt} />
                                    <p className="post-text">
                                        {counterProposal.proposal}
                                    </p>
                                </div>
                                <div className="post-img-wrapper">
                                </div>
                            </>
                        </CounterProposal>
                    ))
                        : null}
                </div>
            </div>
        </div>
    );
}

export default Counterproposals;
