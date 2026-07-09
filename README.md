# Web-Shop
Online Electronics Store\
This is a fully functioning online e-commerce electronics store built using several different AWS services.

This project illustrates a cloud-native services based application which has a Frontend layer, Backend layer, Database layer, Access Layer and Integration layer.

Architecture:

<img width="783" height="382" alt="image" src="https://github.com/user-attachments/assets/f59ee296-f6ec-482c-9657-3eb8cb497fa0" />


AWS Services used to build the application website:

Frontend --> S3, CloudFront, and Route53\
API Layer --> API Gateway, VPC Link, and ALB\
Compute --> ECS and Fargate\
Authentication --> Cognito User Pools\
Databases --> DynamoDB and RDS PostgreSQL\
Messaging --> SNS, SQS, and SES\
Networking --> VPC, Subnets, Security Groups, and NAT Gateway\
Logs and Management --> CloudWatch and Systems Manager\
Security --> IAM


Prerequisites: Ubuntu, AWS CLI, Docker, Git, Node.js

Steps:

1. Install Ubuntu on Windows machine using WSL2\
   Next on the Linux machine (VM) install the below:\
    -Git — version control\
    -Docker — container runtime for building and pushing images\
    -Node.js 20+ and npm — for building the React frontend\
    -AWS CLI v2 — for interacting with AWS services

2. Verify Installation using below commands:\
   aws --version\
   docker --version\
   node --version\
   npm --version\
   git --version

3. Install and configure AWS CLI on your machine\
   Check AWS website for instructions on installing and configuring AWS CLI

4. Networking:

   Create the VPC infrastructure with public and private subnets across 2 availability zones (AZ)

   Note: Choose your AWS region

   VPC - CIDR 10.10.0.0/16\
   Public Subnets - 2 subnets for NAT Gateway and Bastion host\
   Private ECS Subnets - 2 subnets for application services\
   Private Database (DB) Subnets - 2 subnets for RDS instances\
   Internet Gateway - Internet access for public subnets\
   NAT Gateway - Internet access for private subnets\
   Route Tables - Traffic routing configuration

<img width="892" height="417" alt="image" src="https://github.com/user-attachments/assets/947e189d-060c-46a4-a77a-fa2e14b8cd7b" />


   Steps:

   VPC:

   VPC Console → Your VPCs → Create VPC\
   Name: Web App-vpc\
   IPv4 CIDR block: 10.10.0.0/16\
   Tenancy: Default\
   Create VPC

   Internet Gateway:

   VPC Console → Internet Gateways → Create internet gateway\
   Name: Web App IGW\
   Create internet gateway\
   Actions → Attach to VPC\
   Select: Web App-vpc\
   Attach internet gateway

   Subnets:
   
   Public Subnet 1:

    VPC Console → Subnets → Create subnet
    VPC: Web App-vpc
    Name: Web App-subnet-public-1
    Availability Zone: us-east-1a
    IPv4 CIDR block: 10.10.0.0/24
    Create subnet

    Repeat for the rest of the subnets below:

    Public	      Web App-subnet-public2	       CIDR 10.10.1.0/24	Region us-east-1a	 Purpose --> NAT Gateway, Bastion host (For HA setup if required)
    Private ECS	Web App-subnet-ecs-private1    CIDR	10.10.10.0/24	Region us-east-1a	 Purpose --> ECS Services, Internal ALB, APIGW VPCLink
    Private ECS	Web App-subnet-ecs-private2	 CIDR 10.10.11.0/24	Region us-east-1a	 Purpose --> ECS Services, Internal ALB, APIGW VPCLink
    Private DB	   Web App-subnet-db-private3	    CIDR 10.10.20.0/24	Region us-east-1a	 Purpose --> RDS Primary
    Private DB	   Web App-subnet-db-private4	    CIDR 10.10.21.0/24	Region us-east-1a	 Purpose --> RDS Standby (For HA setup if required)


  NAT Gateway:

  VPC Console → NAT Gateways → Create NAT gateway\
  Name: Web-App-GW\
  Availability Mode: Zonal\
  Subnet: Web App-subnet-public-1\
  Connectivity type: Public\
  Elastic IP allocation: Allocate Elastic IP\
  Create NAT gateway

  Public Route Table:

  VPC Console → Route Tables → Create route table\
  Name: Web App-RT\
  VPC: Web App-vpc\
  Create route table\
  Routes tab → Edit routes → Add route\
  Destination: 0.0.0.0/0\
  Target: Internet Gateway (Web App IGW)\
  Subnet associations tab → Edit subnet associations\
  Associate both public subnets
  
  Private ECS Route Table:
  
  Create route table: Web App Pvt RT\
  Add route: 0.0.0.0/0 → NAT Gateway\
  Associate: Both private ECS subnets
  
  Private Database Route Table:
  
  Create route table: Web App DB Pvt RT\
  No new route required\
  Associate: Both private database subnets


  Authentication:

  Set up AWS Cognito User Pool and App Client for user authentication and authorization.

  Create User Pool:

  Go to AWS Cognito Console → User pools → Create user pool

  Define your application: Select Single-page application (SPA)
  
  Name for application: Web App (or choose another)
  
  Configure options:
  
  Options for sign-in identifiers: Select Email\
  Self-registration: Enable\
  Required attributes for sign-up: Select email and name\
  Add a return URL: https://yourdomain.com (add domain name or else leave it blank)
  
  Click Create user directory


  Configure Cognito User Pool App Client:

  Go to your new User Pool → App integration tab → App clients\
  Click on your app client name and Edit\
  Under Authentication flows, enable:\
  ALLOW_USER_PASSWORD_AUTH\
  ALLOW_USER_SRP_AUTH\
  ALLOW_REFRESH_TOKEN_AUTH\
  Click Save changes


  Note down the following values in a notepad

  User Pool ID (e.g., us-east-1_xxxxxxxxx)\
  App Client ID (e.g., 1a2b3c4d5e6f7g8h9i0j1k2l3m)\
  Cognito Domain (User Pool -> Branding -> Domain)


  Frontend Deployment:

  Set up the infrastructure for the React frontend, configure it with Cognito values, deploy it to S3 and access it through CloudFront. This allows to test login/signup functionality early.

  Tasks:\
  -Create S3 bucket for hosting frontend build assets\
  -Create CloudFront distribution with S3 origin\
  -Configure CloudFront Root document and Custom Error Pages\
  -Configure and Build React Application and Deploy to S3\
  -Test login/signup functionality

 <img width="881" height="417" alt="image" src="https://github.com/user-attachments/assets/ce2d70d4-fe9c-4d63-9c8b-21bf79f31de0" />


  S3 Bucket Configuration:\
  S3 Console → Buckets → Create bucket -> General Purpose\
  Bucket name: web-app-bucket19 (must be unique)\
  Region: us-east-1 or your region (Ensure you're in the right AWS region for S3 console)\
  Block all public access: Keep checked (CloudFront will access this bucket privately)\
  Bucket versioning: Disable\
  Encryption: Default - Enable (SSE-S3)\
  Create bucket

  CloudFront Distribution configuration:

  CloudFront Console → Distributions → Create distribution\
  Distribution name: Web App CloudFront\
  Distribution type: Single website or app -> Next\
  Origin type: Amazon S3\
  Origin: Select your frontend s3 bucket\
  Settings: Allow private S3 bucket access to CloudFront - Recommended\
  Settings: Use recommended cache settings tailored to serving S3 content -> Next\
  Enable Security: Select "Do not enable security protections"\
  Create distribution

  Configure CloudFront Root document and Custom Error Pages:\
  Go to your CloudFront distribution -> General -> Edit -> Update Default root object: index.html -> Save changes\
  Error pages → Create custom error response\
  HTTP error code: 403\
  Customize error response: Yes\
  Response page path: /index.html\
  HTTP response code: 200\
  Create
  
  Repeat for HTTP error code 404

  Save these values:

  CloudFront Distribution ID (e.g., E30JU8N49IUDRS)\
  CloudFront Domain Name (e.g., d1234567890.cloudfront.net)


  Configure and Build React Application and Deploy to S3:

  Navigate to frontend directory in your local machine with the below command:\
  cd frontend/react-app

  Next, edit src/aws-config.js and replace the user pool and cognito client ID values copied earlier:

      const awsConfig = {
        Auth: {
          Cognito: {
            userPoolId: '<COGNITO_USER_POOL_ID>',       // e.g., ap-south-1_xxxxxxxxx
            userPoolClientId: '<COGNITO_CLIENT_ID>',    // e.g., 1a2b3c4d5e6f7g8h9i0j1k2l3m
            loginWith: {
              email: true,
            },
          }
        },
        API: {
          baseUrl: ''  // Leave empty for now — will be updated in Module 7
        }
      };
      
      export default awsConfig;

  Build and Deploy React frontend:

  Install dependencies:\
  npm install\
  npm build

  Deploy frontend build to S3:

  aws s3 sync build/ s3://<your-frontend-bucket-name> --delete --exclude "images/*"

  Update Cognito Callback URL
  
  Cognito Console → User pools → Web App User Pool\
  App integration tab → App clients → Click your app client\
  Edit Login pages settings:\
  Allowed callback URLs: Add https://<your-cloudfront-domain>\
  Allowed sign-out URLs: Add https://<your-cloudfront-domain>\
  Save changes


  Test Login/Signup:

  Try opening your CloudFront URL in a browser -->  https://<your-cloudfront-domain>

  Working as expected --> Sign up with email, Email verification, and Login / logout\
  Not yet working --> Product listing, Cart, and Orders (Frontend-Backend configuration required)

  Data Storage Layer:

  Upload Product Images to S3 bucket using script:\
  cd data\
  bash upload-images-to-s3.sh <your-bucket-name>

  Check that the images are publicly accessible over the internet using CloudFront URL --> Example: https://dhzk1s0exnne1.cloudfront.net/images/products/prod-001.jpg

  DynamoDB:

  Create Products Table\
  DynamoDB Console → Tables → Create table\
  Table name: ecommerce-products\
  Partition key: product_id (String)\
  Sort key: Leave empty (no sort key needed)\
  Table class: DynamoDB Standard\
  Capacity mode: On-demand\
  Create table


  Create Cart Table\
  DynamoDB Console → Tables → Create table\
  Table name: ecommerce-cart\
  Partition key: user_id (String)\
  Sort key: Leave empty (no sort key needed)\
  Table class: DynamoDB Standard\
  Capacity mode: On-demand\
  Create table


  Load Sample Products Data:\
  cd data\
  bash update-product-image-urls.sh <cloudfront URL>

  Load Products into DynamoDB:\
  bash load-products.sh <your-region>

  Verify that DynamoDB table is updated:

  Go to DynamoDB -> ecommerce_products table and check if there are 20 products data with updated image URLs.

  RDS - PostgreSQL Database:

  Create DB Subnet Group\
  RDS Console → Subnet groups → Create DB subnet group\
  Name: ecommerce-db\
  Description: "Subnet group for web app RDS"\
  VPC: Select Web App-vpc\
  Add subnets:\
  Select both availability zones (us-east-1a, us-east-1b)\
  Select both private database subnets
  Create

  Create Security Group for RDS\
  VPC Console → Security Groups → Create security group\
  Name: ecommerce-rds-sg\
  Description: "Security group for RDS PostgreSQL"\
  VPC: Select Web App-vpc\
  Inbound rules:\
  Type: PostgreSQL\
  Port: 5432\
  Source: Custom - 10.10.0.0/16 (VPC CIDR)\
  Description: "Allow PostgreSQL from VPC"\
  Outbound rules: Keep default (all traffic)\
  Create


Create RDS Instance

RDS Console → Databases → Create database\
Engine options:\
Engine type: PostgreSQL\
Choose a database creation method: Full configuration\
Templates: Free Tier
Availability and durability: Single-AZ DB instance deployment (1 instance)
Engine version: PostgreSQL 18.3R1

Settings:\
  DB instance identifier: ecommercedb-instance\
  Master username: postgres\
  Master password: (create a password - ensure to save it!)\
  Database authentication: Password authentication\
  Instance configuration:\
  DB instance class: Burstable classes - db.t4g.micro
  
Connectivity:\
  VPC: Web App-vpc\
  DB subnet group: Web App-subnet-db-private3\
  Public access: No\
  VPC security group: Choose existing - ecommerce-rds-sg\
  Availability Zone: Choose first AZ

Monitoring:\
  Uncheck "Enable Performance Insights"
  
Additional configuration:\
  IMPORTANT: Initial database name: ecommercedb\
  Uncheck "Enable automated backups"\
  Uncheck "Enable encryption"\
  Create database (takes 5-10 minutes)


Parameter Store - Configuration Management:

  Create Database Configuration Parameters:

  Systems Manager Console → Parameter Store → Create parameter
  
  AWS Region Parameter:\
  Name: /ecommerce/dev/aws/region\
  Type: String\
  Value: <your-aws-region> (e.g. us-east-1)
  
  Database Host Parameter:\
  Name: /ecommerce/dev/db/host\
  Type: String\
  Value: <your-rds-endpoint> (from RDS Console → Databases → ecommerce-db → Endpoint)\
  Database Password Parameter:

  Name: /ecommerce/dev/db/password\
  Type: SecureString\
  Value: <your-database-password>\
  These parameters will be automatically loaded by the user-service and order-service when deployed to ECS.


  Backend Services Deployment (ECS and ALB):

  Next, we deploy microservices using Docker containers on Amazon ECS with Fargate run time and internally expose the services using the internal Application Load Balancer.

  <img width="1086" height="506" alt="573800788-ce3a7981-6d9b-42f1-a2c0-9494be3f6837" src="https://github.com/user-attachments/assets/b6f1a0df-487a-4582-96bb-59a5c2c465b3" />

  
Create Application Load Balancer (internal):

Create ALB Security Group\
EC2 Console → Security Groups → Create security group\
Name: web-ALB-SG\
Description: "Security group for internal ALB"\
VPC: Select Web App-vpc\
Inbound rules:\
Type: HTTP, Port: 80, Source: 10.10.0.0/16 (VPC CIDR)\
Description: "Allow HTTP from VPC"\
Outbound rules: All traffic (default)\
Create security group


Create Target Groups:\
Create 4 target groups for the microservices first (required for ALB creation):

Product Service Target Group:\
EC2 Console → Load Balancing -> Target Groups → Create target group\
Target type: IP addresses\
Target group name: product-tg\
Protocol: HTTP, Port: 8001\
VPC: Web App-vpc\
Health check path: /health\
Create target group

Repeat for other services target groups:\
Cart Service: cart-tg, Port: 8002\
User Service: user-tg, Port: 8003\
Order Service: order-tg, Port: 8004


Create Application Load Balancer:

EC2 Console → Load Balancers → Create load balancer\
Application Load Balancer → Create

Basic configuration:\
Name: Web-App-LB\
Scheme: Internal\
IP address type: IPv4

Network mapping:\
VPC: Web App-vpc\
Subnets: Select both private ECS subnets\
Security groups: Select web-ALB-SG\
Listeners: HTTP:80\
Default action: Forward to product-tg\
Create load balancer

Configure ALB Listener Rules

Go to Load Balancer → Listeners → HTTP:80 → View/edit rules

Add rules for path-based routing:\
Product Service Rule:\
IF: Path is /products*\
THEN: Forward to product-service-tg

Cart Service Rule:\
IF: Path is /cart*\
THEN: Forward to cart-service-tg

User Service Rule:\
IF: Path is /users*\
THEN: Forward to user-service-tg

Order Service Rule:\
IF: Path is /orders*\
THEN: Forward to order-service-tg

Leave all the weight as 1

Save rules
  

Create Parameter Store Parameters

Service URL Parameters\
Systems Manager Console → Parameter Store → Create parameter

User Service URL:\
Name: /ecommerce/dev/user-service-url\
Type: String\
Value: http://<internal-alb-dns-name> (get from ALB details)\
Repeat for other services:

/ecommerce/dev/cart-service-url → http://(internal-alb-dns-name) \
/ecommerce/dev/product-service-url → http://(internal-alb-dns-name) 

Note: All services use the same ALB DNS name. The ALB routes requests based on path.


Create ECR Repositories:

Create Repository for Product Service\
ECR Console → Repositories → Create repository\
Repository name: ecommerce/product-service\
Create repository

Repeat the above steps for the remaining 3 services.

Validation Table\
Create repositories for all services:

   Service	              Repository Name
Product Service   	ecommerce/product-service\
Cart Service	      ecommerce/cart-service\
User Service	      ecommerce/user-service\
Order Service	      ecommerce/order-service\


Build and Push Docker Images:

Note: Below CMDs need to be executed from the local machine (not from AWS console or EC2 instance).

In the AWS console:

Console: ECR Console → Repositories → Click any repository → Copy the URI (everything before the repository name)

Build and Push Product Service Image:

Get ECR login command:

aws ecr get-login-password --region <your-region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<your-region>.amazonaws.com


Build the image:

cd services/product-service\
docker build -t ecommerce/product-service .

Tag the image:\
docker tag ecommerce/product-service:latest <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/product-service:latest

Push the image:\
docker push <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/product-service:latest

Build and Push other services

Note: Make sure to change to each service directory before building.

Cart Service:\
cd ../cart-service  # Navigate to cart-service directory\
docker build -t ecommerce/cart-service .\
docker tag ecommerce/cart-service:latest <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/cart-service:latest\
docker push <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/cart-service:latest

User Service:\
cd ../user-service  # Navigate to user-service directory\
docker build -t ecommerce/user-service .\
docker tag ecommerce/user-service:latest <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/user-service:latest\
docker push <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/user-service:latest

Order Service:\
cd ../order-service  # Navigate to order-service directory\
docker build -t ecommerce/order-service .\
docker tag ecommerce/order-service:latest <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/order-service:latest\
docker push <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/order-service:latest


Create IAM Role for ECS Tasks

Create ECS Task Role\
IAM Console → Roles → Create role\
Trusted entity type: AWS service\
Service: Elastic Container Service\
Use case: Elastic Container Service Task\
Next

Attach permissions policies:

6. Add the following AWS managed policies:

AmazonDynamoDBFullAccess_v2 (use v2 for better security)\
AmazonSSMReadOnlyAccess\
CloudWatchLogsFullAccess\
AmazonS3ReadOnlyAccess\
AmazonSNSFullAccess\
Role name: ecommerce-ecs-task-role\
Create role

Create ECS Security Group

ECS Tasks Security Group\
VPC Console → Security Groups → Create security group\
Name: ecommerce-ecs-sg\
Description: "Security group for ECS tasks"\
VPC: Select ecommerce-vpc\
Inbound rules:\
Type: Custom TCP, Port: 8001, Source: ecommerce-alb-sg\
Type: Custom TCP, Port: 8002, Source: ecommerce-alb-sg\
Type: Custom TCP, Port: 8003, Source: ecommerce-alb-sg\
Type: Custom TCP, Port: 8004, Source: ecommerce-alb-sg\
Outbound rules: All traffic (default)\
Create security group

Create ECS Task Definitions\
Create Task Definition for Product Service

ECS Console → Task definitions → Create new task definition\
Task definition family: ecommerce-product-service\
Launch type: AWS Fargate\
Operating system: Linux/X86_64\
CPU: 1 vCPU\
Memory: 3 GB\
Task role: ecommerce-ecs-task-role\
Task execution role: Create default role (This should create a role ecsTaskExecutionRole automatically which will be reused for other services.)

Container definition:

Container name: product-service

Image URI: <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/product-service:latest

Port mappings: Container port 8001, Protocol TCP

Environment variables:\
ENVIRONMENT = dev\
AWS_REGION = <your-region>\
Log configuration:

Log driver: awslogs\
Log group: /ecs/product-service\
Region: <your-region>\
Stream prefix: ecs

Create task definition

Repeat the above steps for the remaining 3 services, changing the port numbers and image URIs accordingly.

Create task definitions for all services:

Service	               Task Definition	     CPU   Memory	Port\
Product Service	ecommerce-product-service	1 vCPU	3 GB	8001\
Cart Service	   ecommerce-cart-service   	1 vCPU	3 GB	8002\
User Service	   ecommerce-user-service	   1 vCPU	3 GB	8003\
Order Service	   ecommerce-order-service	   1 vCPU	3 GB	8004

Create ECS Cluster and Services

Create ECS Cluster\
ECS Console → Clusters → Create cluster\
Cluster name: ecommerce-cluster\
Infrastructure: Fargate Only (serverless)\
Create cluster

Create ECS Service for Product Service\
Go to cluster → Services → Create service\
Launch type: Fargate\
Task definition: ecommerce-product-service:1\
Service name: ecommerce-product-service\
Desired tasks: 1\
Networking - VPC: Web App-vpc\
Subnets: Select both private ECS subnets (deselect rest of the subnets if they are auto selected)\
Security group: ecommerce-ecs-sg\
Public IP: Turned off\
Load Balancing: Enable "Use load balancing"\
Load balancer type: Application Load Balancer\
Load balancer: ecommerce-internal-alb\
Target group: product-service-tg\
Create service\
Repeat the above steps for the remaining 3 services.

Create services for all microservices:

Service	             ECS Service Name	           Target Group     	Desired Tasks\
Product Service	ecommerce-product-service  	product-service-tg      	1\
Cart Service	   ecommerce-cart-service	        cart-service-tg	         1\
User Service	   ecommerce-user-service	        user-service-tg	         1\
Order Service	   ecommerce-order-service	        order-service-tg	      1

Verify ECS Services

Check Service Status\
ECS Console → Clusters → ecommerce-cluster → Services\
Verify that all 4 services show as below:\
Status: Active\
Running tasks: 1\
Desired tasks: 1

Check Target Group Health\
EC2 Console -> Load Balancer → Target Groups\
For each target group, verify:\
Registered targets: 1\
Health status: Healthy

Test API Endpoints:

Launch a Bastion Host for testing only as we can't directly access the internal ALB URL. We will terminate the instance after validation

<img width="494" height="463" alt="image" src="https://github.com/user-attachments/assets/5070ca9a-31d4-4889-a092-1ef6e5061405" />

Create Bastion Host:

EC2 Console → Launch Instance\
Name: web-app-bastion\
AMI: Amazon Linux 2023\
Instance type: t3.micro\
Key pair: Select or create a key pair\
Network settings:\
VPC: Web App-vpc\
Subnet: Select a public subnet\
Auto-assign public IP: Enable\
Security group: Create new\
Name: ecommerce-bastion-sg\
SSH (22) from your IP address\
Launch instance


Test API Endpoints:

SSH into bastion host:\
ssh -i your-key.pem ec2-user@<bastion-public-ip>

Test product service:\
curl http://<internal-alb-dns-name>/products

At this point it should return the list of all the products.

Stop or terminate the bastion host ec2 instance after validation. It is not required anymore.

Troubleshooting Steps (If needed):

Check CloudWatch Logs\
If services are not starting properly, check the logs:

CloudWatch Console → Log groups\
Check these log groups:\
/ecs/product-service\
/ecs/cart-service\
/ecs/user-service\
/ecs/order-service\
Service not starting:

Check ECR image URI in task definition\
Verify environment variables are set correctly

Check IAM task role is assigned\
Health check failing:

Verify /health endpoint exists in your service\
Check security group allows traffic on service ports\
Parameter Store access issues:

Verify parameter names match exactly (case-sensitive)\
Check parameter exists in correct region


API Gateway

Create an HTTP API Gateway that connects to the internal Application Load Balancer, providing a public endpoint to access all microservices.

Tasks:\
Create a VPC Link for API Gateway to connect privately to the internal ALB\
Create HTTP API Gateway\
Create HTTP proxy integration to internal ALB (VPC Resource) via VPCLink\
Create Cognito JWT Authorizer for authentication\
Create API routes\
API CORS configuration for frontend access\
API endpoint testing

<img width="911" height="362" alt="image" src="https://github.com/user-attachments/assets/888580a9-fea5-431c-a9e8-44468f482841" />

The API Gateway will have three specific routes:

GET /products → Product Service (public, no auth)\
ANY /{proxy+} → All Services (authenticated, Cognito-authorizer required)\
OPTIONS /{proxy+} → CORS preflight (public, no auth)

Create VPC Link

Create Security Group for VPC Link

VPC Console → Security Groups → Create security group\
Name: ecommerce-vpclink-sg\
Description: "Security group for VPC Link to ALB"\
VPC: Select ecommerce-vpc\
Inbound rules:\
Type: HTTP, Port: 80, Source: 0.0.0.0/0 (API Gateway traffic)\
Type: HTTPS, Port: 443, Source: 0.0.0.0/0 (API Gateway traffic)\
Outbound rules: All traffic (default)\
Create security group

VPC Link Configuration\
API Gateway Console → VPC Links → Create VPC Link\
VPC Link version: VPC Link for HTTP APIs (v2)\
Name: ecommerce-vpc-link\
Description: "VPC Link for ecommerce internal ALB"\
VPC: Select Web App-vpc\
Subnets: Select both private ECS subnets:\
ecommerce-private-ecs-1\
ecommerce-private-ecs-2\
Security groups: Select ecommerce-vpclink-sg\
Create VPC Link

VPC Link creation takes 5-10 minutes. Wait for status to become "Available" before proceeding.

Create HTTP API Gateway

API Gateway Configuration\
API Gateway Console → APIs → Create API\
Choose: HTTP API → Build\
API name: ecommerce-api\
Description: "eCommerce HTTP API"\
Next\
Skip adding integrations - we'll configure these manually\
Create\
Go to your API → Stages → Create stage\
Stage name: $default\
Enable Auto-deploy\
Create

Create HTTP Integration

ALB Integration over VPCLink (VPC Private Resource integration)\
Create one integration that will be used by all routes:

Go to your API → Develop → Integrations → Manage integrations → Create\
Integration type: Private resource\
Target service: ALB/NLB\
Load balancer: Select Web App-alb\
Listener: HTTP:80\
VPC Link: Select ecommerce-vpc-link\
Create integration

Create Cognito JWT Authorizer

Cognito JWT Authorizer Configuration\
Go to your API → Authorization → Authorizers → Create authorizer\
Name: cognito-jwt-authorizer\
Authorizer type: JWT\
Identity source: $request.header.Authorization\
Issuer URL: https://cognito-idp.<your-region>.amazonaws.com/<user-pool-id>\
Replace <your-region> and <user-pool-id> with your values or get this URL from Cognito -> User Pool -> App Client -> Quick Setup guide -> authority\
Audience: <your-app-client-id>\
Use the App Client ID from Module 3\
Create authorizer


Create API Routes

Route 1: Public Products Route\
Go to your API → Routes → Create route\
Method: GET\
Resource path: /products\
Integration: Select the ALB Integration created above\
Authorization: None\
Create route

Route 2: Authenticated Proxy Route\
Create route\
Method: ANY\
Resource path: /{proxy+}\
Integration: Select the ALB Integration created above\
Authorization: JWT\
Authorizer: Select cognito-jwt-authorizer\
Create route

Route 3: CORS Preflight Route\
Create route\
Method: OPTIONS\
Resource path: /{proxy+}\
Integration: Select the ALB Integration created above\
Authorization: None\
Create route

Note:\
All three routes use the same ALB integration\
/products is public (no authentication required)\
/{proxy+} requires JWT authentication for all other endpoints\
OPTIONS /{proxy+} handles CORS preflight requests without authentication

Configure CORS:

Go to your API → CORS → Configure\
Access-Control-Allow-Origin: * (or specify your frontend domain)\
Access-Control-Allow-Headers: * (allows all headers - recommended for development)\
Access-Control-Allow-Methods:\
GET,POST,PUT,DELETE,OPTIONS

Save

Note: Using * for Access-Control-Allow-Headers prevents CORS preflight issues with custom headers like Authorization tokens.

Test API Gateway

Get API Gateway URL\
Go to your API → Stages → $default\
Copy the Invoke URL (e.g., https://xxxxxxxxxx.execute-api.<region>.amazonaws.com)

Test All Service Endpoints\
Test Public Products Endpoint

curl https://xxxxxxxxxx.execute-api.<region>.amazonaws.com/products

Test Authorized Endpoints (Should Return 401):

curl https://xxxxxxxxxx.execute-api.<region>.amazonaws.com/cart\
curl https://xxxxxxxxxx.execute-api.<region>.amazonaws.com/users\
curl https://xxxxxxxxxx.execute-api.<region>.amazonaws.com/orders\
# Expected: {"message":"Unauthorized"}


Troubleshooting\
CORS Errors:

If you see "Access-Control-Allow-Origin" errors, ensure CORS is configured with Access-Control-Allow-Headers: *\
Verify OPTIONS routes are created for preflight requests\
401 Unauthorized:

Verify Cognito User Pool ID in authorizer configuration\
Ensure App Client ID matches in authorizer audience\
502 Bad Gateway:

Check VPC Link status\
Verify internal ALB DNS name in integration URI\
Ensure ALB target groups are healthy\
504 Gateway Timeout:

Check ECS service health\
Verify ALB listener rules are configured correctly\
Check VPCLink Security group (should allow HTTP/HTTPS from 0.0.0.0/0) and ALB Security group (should allow HTTP from VPC CIDR)

We have configured:\
Authentication: Public products endpoint, authenticated for other services\
CORS Support: Dedicated OPTIONS route for preflight requests\
Secure Connection: VPC Link ensures private communication between API gateway and ALB.\
Flexible Access: Public product browsing, authenticated user actions

Frontend-Backend Integration:

Now that the API Gateway is deployed, update the React application with the API Gateway URL, rebuild, and redeploy to S3. This completes the frontend integration and makes all features fully functional.

Tasks:

Update frontend with the API Gateway URL\
Rebuild and redeploy frontend to S3\
Invalidate CloudFront cache\
Test the fully integrated application

Update frontend with API Gateway URL

Navigate to frontend directory:\
cd frontend/react-app

Edit src/aws-config.js — update only the baseUrl field:

const awsConfig = {\
  Auth: {\
    Cognito: {\
      userPoolId: '<COGNITO_USER_POOL_ID>',       // Already set in Module 3\
      userPoolClientId: '<COGNITO_CLIENT_ID>',    // Already set in Module 3\
      loginWith: {\
        email: true,\
      },\
    }\
  },\
  API: {\
    baseUrl: '<API_GATEWAY_URL>'  // e.g., https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com\
  }\
};

export default awsConfig;

Rebuild and redeploy frontend to S3:

npm run build\
aws s3 sync build/ s3://<your-frontend-bucket-name> --delete --exclude "images/*"

Next, Invalidate CloudFront Cache from AWS Console or using AWS CLI:

Go to CloudFront Distribution -> Invalidations -> Create invalidation -> Object paths: /* -> Create invalidation

Invalidation usually completes within 1 minute.


Time to test the Fully Integrated Application:

Open your CloudFront URL in a browser:

https://<your-cloudfront-domain>

Do  a test and see if the sign in, product listing, adding to cart, placing an order, order history etc. works.


Notification and Integration (SNS and SQS):

Set up event driven flows using Amazon SNS and SQS for order notifications and integration with 3rd party vendors.

Note:

Ideally for the email notification we should use Amazon SES (Simple Email Service) where we have the Lambda function subscription for SNS topic and Lambda triggers an email to the email id from the order event using SES. However by default SES service is in Sandbox mode in AWS account and it applies restriction on sending emails from un-verified sender. We have to ask AWS to move SES service out of SandBox and enable it for the Production use and this may take few days. Hence, we are going to send email directly to fixed email id using the Amazon SNS.

Architecture:

<img width="613" height="301" alt="image" src="https://github.com/user-attachments/assets/cf57c4a3-6643-464a-a9c9-e78ca9a92231" />

Create SNS Topic

SNS Topic Configuration\
SNS Console → Topics → Create topic\
Type: Standard\
Name: ecommerce-order-events\
Display name: eCommerce Order Events\
Create topic\
Note Topic ARN\
Copy the Topic ARN (e.g., arn:aws:sns:<region>:<account-id>:ecommerce-order-events)\
Save this ARN - we'll use it in Parameter Store

Create SQS Queue for Logging:

SQS Queue Configuration\
SQS Console → Queues → Create queue\
Type: Standard queue\
Name: ecommerce-order-shipping\
Create queue


Configure SNS Subscriptions

Email Subscription\
Go to SNS topic → Subscriptions → Create subscription\
Topic ARN: Select ecommerce-order-events\
Protocol: Email\
Endpoint: Enter your email address (e.g., admin@yourdomain.com)\
Create subscription\
Check your email for confirmation message\
Click "Confirm subscription" link in the email\
Verify status shows "Confirmed" in SNS console\
SQS Subscription for Shipping\
Create subscription\
Topic ARN: Select ecommerce-order-events\
Protocol: Amazon SQS\
Endpoint: Enter the SQS queue ARN from step 7.2\
Create subscription\
Verify status shows "Confirmed"\
This should automatically update the SQS queue Policy to allow SQS:SendMessage action for SNS Topic.

Go to SQS Queue -> Queue Policies and Verify.

Subscription Summary\
You now have two subscriptions:

Email: Direct notifications to your email\
SQS: Message for shipping vendor

Update Parameter Store

SNS Topic ARN Parameter\
Systems Manager Console → Parameter Store → Create parameter\
Name: /ecommerce/dev/sns/topic-arn\
Type: String\
Value: arn:aws:sns:<region>:<account-id>:ecommerce-order-events\
Create parameter

This parameter is already created and used by the order service to publish messages to SNS.

Restart the Order Service to fetch SNS Topic ARN

ECS Cluster -> Services -> Order Service -> Force new deployment\
Wait until Order Service status changes to 1 Task Running\
This will make sure that Order Service fetches SNS Topic ARN from SSM Parameter Store and publishes order event on to the topic.

Test Notification Workflow

Place an order through the frontend\
Order service publishes to SNS topic\
SNS sends email Check email for order notification\
SNS also sends message to SQS queue for shipping. Verify messages in the SQS queue -> Send and receive message -> Poll for messages

Custom Domain & SSL:

Access application using Custom domain name and enable HTTPS with SSL certificate

<img width="870" height="396" alt="image" src="https://github.com/user-attachments/assets/97e3b5ba-0ea2-4cc2-9568-30713467c416" />

Prerequisites:

A registered public domain name (can be registered via Route53 or use existing one).\
Amazon Route 53 should be configured as DNS provider for the domain name.

Route 53 Public Hosted Zone (pre-requisite)

Route53 Console → Hosted zones → Create hosted zone\
Domain name: yourdomain.com\
Type: Public hosted zone\
Create\
Note the 4 nameservers (NS records)\
Update nameservers at your domain registrar


Request SSL Certificate in ACM:

Request Certificate\
Go to ACM Console → Switch to us-east-1 region\
Request certificate → Request a public certificate\
Domain names:\
yourdomain.com\
www.yourdomain.com\
*.yourdomain.com (optional, for subdomains)\
Validation method: DNS validation\
Request\
Validate Certificate\
In ACM, click on your certificate\
Click "Create records in Route53" button\
This automatically adds CNAME records to your hosted zone\
Wait for validation (usually 1-2 minutes)\
Status should change to "Issued"


Add alternate domain name for CloudFront Distribution:

CloudFront Console → Your distribution → Edit\
Settings:\
Alternate domain names (CNAMEs): Add yourdomain.com and www.yourdomain.com\
Custom SSL certificate: Select your ACM certificate\
Save changes\
Wait for deployment (5-10 minutes)

Create Route53 Records:

A Record for Top level domain:

Route53 → Hosted zones → Your domain\
Create record:\
Record name: Leave empty (root domain)\
Record type: A\
Alias: Yes\
Route traffic to: Alias to CloudFront distribution\
Choose distribution: Select your CloudFront distribution\
Routing policy: Simple routing\
Create record\
A Record for www:

Create record:\
Record name: www\
Record type: A\
Alias: Yes\
Route traffic to: Alias to CloudFront distribution\
Choose distribution: Select your CloudFront distribution\
Create record

Update Cognito Callback URLs:

Cognito Console → User pools → your user pool\
App integration → App client → Edit

Hosted UI settings:\
Add callback URLs: https://yourdomain.com, https://www.yourdomain.com\
Add sign-out URLs: https://yourdomain.com, https://www.yourdomain.com\
Save

Finally, test the Application with Custom Domain:

Open browser: https://yourdomain.com\
Verify SSL certificate: Should show secure/valid certificate (green lock icon)

Test all the website functionalities:\
Browse products (should load from API)\
Sign in/Sign up (Cognito authentication)\
Add items to cart\
Place test order\
Check that all features work

At this point, a production-ready ecommerce application on AWS with custom domain and SSL certificate should be successfully deployed.

