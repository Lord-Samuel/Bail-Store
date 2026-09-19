const { createHash } = require('crypto');

const LabelAssociationType = {
    Chat: 'Chat',
    Message: 'Message',
};

const md5 = (input) => Promise.resolve(createHash('md5').update(input).digest());

const toNumber = (t) =>
    typeof t === 'object' && t
        ? ('toNumber' in t ? t.toNumber() : t.low)
        : (t || 0);

const JID_REGEX = /^([^@:]*)(?::([^@]*))?@([^@]*)$/;

const jidDecode = (jid) => {
    if (!jid || typeof jid !== 'string') return undefined;
    const match = JID_REGEX.exec(jid);
    if (!match) return undefined;

    const [, user, deviceStr, server] = match;

    const device = deviceStr !== undefined && deviceStr !== ''
        ? parseInt(deviceStr, 10)
        : undefined;

    // 0 = WA JID, 1 = LID, 2 = hosted WA JID, 3 = hosted LID
    let domainType;
    if (server === 'lid') domainType = 1;
    else if (server === 'hosted') domainType = 2;
    else if (server === 'hosted.lid') domainType = 3;
    else domainType = 0;

    return {
        user,
        server,
        device: Number.isNaN(device) ? undefined : device,
        domainType,
    };
};

const jidNormalizedUser = (jid) => {
    if (!jid) return jid;
    const decoded = jidDecode(jid);
    if (!decoded) return jid;
    const { user, server } = decoded;
    if (!user) return jid;
    return `${user}@${server}`;
};

const getKeyAuthor = (key, meId = 'me') =>
    (key?.fromMe ? meId : key?.participantAlt || key?.remoteJidAlt || key?.participant || key?.remoteJid) || '';

p0const updateMessageWithReaction = (msg, reaction) => {
    const authorID = getKeyAuthor(reaction.key);
    const reactions = (msg.reactions || []).filter(r => getKeyAuthor(r.key) !== authorID);
    reaction.text = reaction.text || '';
    reactions.push(reaction);
    msg.reactions = reactions;
};

const updateMessageWithReceipt = (msg, receipt) => {
    msg.userReceipt = msg.userReceipt || [];
    const existing = msg.userReceipt.find(m => m.userJid === receipt.userJid);
    if (existing) Object.assign(existing, receipt);
    else msg.userReceipt.push(receipt);
};

const HISTORY_SYNC_ON_DEMAND = 2;

module.exports = { LabelAssociationType, md5, toNumber, jidDecode, jidNormalizedUser, updateMessageWithReaction, updateMessageWithReceipt, noopLogger, HISTORY_SYNC_ON_DEMAND };
