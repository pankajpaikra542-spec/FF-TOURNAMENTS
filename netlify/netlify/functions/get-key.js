exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      key: process.env.RAZORPAY_KEY_ID,
    }),
  };
};
