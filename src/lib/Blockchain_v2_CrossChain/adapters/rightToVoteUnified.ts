import { env } from '$env/dynamic/public';

import * as v1 from '$lib/Blockchain_v1_Ethereum/javascript/rightToVote';
import * as v2 from '$lib/Blockchain_v2_CrossChain/adapters/rightToVoteAdapter';

const isV2 = env.PUBLIC_BLOCKCHAIN_VERSION === 'v2';

/**
 * Unified becomeMemberOfGroup for v1 / v2
 */
export async function becomeMemberOfGroup(groupId: number | string) {
    const normalizedGroupId =
        typeof groupId === 'number' ? groupId : Number(groupId);

    return isV2
        ? v2.becomeMemberOfGroup(normalizedGroupId)
        : v1.becomeMemberOfGroup(normalizedGroupId);
}

/**
 * Unified removeGroupMembership for v1 / v2
 */
export async function removeGroupMembership(groupId: number | string) {
    const normalizedGroupId =
        typeof groupId === 'number' ? groupId : Number(groupId);

    return isV2
        ? v2.removeGroupMembership(normalizedGroupId)
        : v1.removeGroupMembership(normalizedGroupId);
}

/**
 * Unified isUserMemberInGroup
 *
 * v2: expects a groupId
 * v1: original implementation does not need a parameter
 */
export async function isUserMemberInGroup(groupId: number | string) {
    const normalizedGroupId =
        typeof groupId === 'number' ? groupId : Number(groupId);

    if (isV2) {
        return v2.isUserMemberOfGroup(normalizedGroupId);
    }

    // v1 version does not require groupId
    return v1.isUserMemberInGroup();
}

/**
 * Unified getGroupsUserIsMemberIn
 *
 * v2: implemented in rightToVoteAdapter.ts
 * v1: implemented in v1 rightToVote
 */
export async function getGroupsUserIsMemberIn() {
    return isV2
        ? v2.getGroupsUserIsMemberIn()
        : v1.getGroupsUserIsMemberIn();
}
