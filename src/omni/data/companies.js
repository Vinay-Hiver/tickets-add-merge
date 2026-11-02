// The customer's company, shown after their name on email cards so people trying the prototype can
// spot conversations from the same domain (only those can be merged).

const COMPANY_BY_DOMAIN = {
  'airbnb.com': 'Airbnb',
  'dell.com': 'Dell',
  'fedex.com': 'FedEx',
  'paypal.com': 'PayPal',
  'shopify.com': 'Shopify',
};

// The customer's email domain: the first message is always from the customer (a merged ticket, whose messages run
// newest first, keeps it as customerEmail).
export const domainOf = (convo) => (convo.customerEmail ?? convo.messages?.[0]?.email)?.split('@')[1]?.toLowerCase();

// Known companies by name; anything else is the domain's first part, capitalised ("northpeak.co" → "Northpeak").
export const companyOf = (convo) => {
  const domain = domainOf(convo);
  if (!domain) return null;
  return COMPANY_BY_DOMAIN[domain] || domain.charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
};
