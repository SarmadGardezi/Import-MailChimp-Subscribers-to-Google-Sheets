const MAILCHIMP_API_KEY = '<<API_KEY_HERE>>';

// MailChimp API key includes the data center id
// that your MailChimp account is associated with
const makeHttpRequest = (endpoint, params = {}) => {
  const [, mailchimpDataCenter] = MAILCHIMP_API_KEY.split('-');
  const url = `https://${mailchimpDataCenter}.api.mailchimp.com/3.0/${endpoint}`;
  const qs = Object.keys(params)
    .map(key => `${key}=${params[key]}`)
    .join('&');
  const apiUrl = qs ? `${url}?${qs}` : url;
  const request = UrlFetchApp.fetch(apiUrl, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${Utilities.base64Encode(`labnol:${MAILCHIMP_API_KEY}`)}`
    }
  });
  return JSON.parse(request);
};

const getListMembers = (id, offset) => {
  const { members } = makeHttpRequest(`lists/${id}/members`, {
    count: 100,
    offset,
    fields: 'members.email_address',
    status: 'subscribed',
    sort_field: 'last_changed',
    sort_dir: 'DESC'
  });
  return members.map(({ email_address: email }) => [email]);
};

// Get a list of all subscribers of a specific
// MailChimp mailing list, you can retrieve the email address,
// name and subscription statues of subscribers
const getMailChimpListMembers = id => {
  let hasMore = true;
  let data = [];
  do {
    const emails = getListMembers(id, data.length);
    data = [...data, ...emails];
    hasMore = emails.length > 0;
  } while (hasMore);
  return data;
};

// Get a list of all audiences / lists from MailChimp
const getMailChimpLists = () => {
  const params = { count: 10, fields: 'lists.id,lists.name', sort_field: 'date_created', sort_dir: 'DESC' };
  const { lists = [] } = makeHttpRequest('lists', params);
  return lists.map(({ id, name }) => ({ id, name, members: getMailChimpListMembers(id) }));
};
