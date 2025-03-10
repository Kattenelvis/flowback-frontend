import { postRequest } from "../../../utils/API";
import React, { useState, useEffect } from "react";
import './styles.css'

export default function GroupButtons({ user_type, groupId, groupJoinStatus, total_members, reload }) {
    const [isMember, setIsMember] = useState(user_type)
    const [totalMembers, setTotalMember] = useState(total_members)

    // Join group request as a member
    const handleOnJoinGroupAsAMember = () => {
        postRequest("api/v1/user_group/join_group", { group: groupId, }).then(
            (response) => {
                setIsMember(true)
                setTotalMember(totalMembers + 1)
                if (response) {
                    const { status, data } = response;
                    // getGroups();
                }
                if (reload) window.location.reload();
            });
    }

    const handleOnLeaveGroup = () => {
        postRequest(`api/v1/user_group/${groupId}/leave_group`).then(
            (response) => {
                setIsMember(false)
                setTotalMember(totalMembers - 1)
                if (response) {
                    const { status, data } = response;
                    // getGroups();
                }
                if (reload) window.location.reload();
            });
    }

    // Join group request as a delegate
    const handleOnJoinGroupAsADelegate = () => {
        postRequest("api/v1/user_group/join_group", { group: groupId, as_delegator: true }).then(
            (response) => {
                if (response) {
                    const { status, data } = response;
                    // getGroups();
                }
            });
    }

    return <div className="">

        <p className="">
            <p>{totalMembers || 0} members</p>
        </p>

        {
            isMember ?
                (user_type !== "Owner" && user_type !== "Delegator") && <h4>
                    <div className="flex-row">
                        <a
                            className="btn  btn-outline-danger"
                            style={{ "margin-right": "1rem", "position": "inherit" }}
                            onClick={() => { handleOnLeaveGroup() }}
                            style={{ filter: "drop-shadow(1px 1px 1px #ffffff)" }}
                        >Leave Group</a>
                    </div>
                </h4> :
                (
                    (groupJoinStatus == "Requested") ?
                        <a
                            href="#"
                            className="btn  btn-outline-secondary"
                        >
                            {groupJoinStatus}
                        </a> :
                        <div className="flex-row">
                            <a
                                className="btn btn-outline-secondary"
                                onClick={() => { handleOnJoinGroupAsAMember() }}
                            >Join Group</a>
                        </div>
                )
        }
    </div>
}