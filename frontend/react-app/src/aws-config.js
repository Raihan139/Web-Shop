const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_ccXgSVOs2',
      userPoolClientId: '1799oqq4r0luneuo2tdal4679e', 
      loginWith: {
        email: true,
      },
    }
  },
  API: {
    baseUrl: 'YOUR_API_GATEWAY_URL' 
  }
};

export default awsConfig;
