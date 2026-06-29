# Web-Shop
Online Electronics Store
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
Security --> IAM\


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
   git --version\

3. Install and configure AWS CLI on your machine\
   Check AWS website for instructions on installing and configuring AWS CLI\

4. Networking:\

   Create the VPC infrastructure with public and private subnets across 2 availability zones (AZ)\

   Note: Choose your AWS region\

   VPC - CIDR 10.10.0.0/16\
   Public Subnets - 2 subnets for NAT Gateway and Bastion host\
   Private ECS Subnets - 2 subnets for application services\
   Private Database (DB) Subnets - 2 subnets for RDS instances\
   Internet Gateway - Internet access for public subnets\
   NAT Gateway - Internet access for private subnets\
   Route Tables - Traffic routing configuration\

   Insert image here\

   Steps:\

   VPC:\

   VPC Console → Your VPCs → Create VPC
   Name: Web App-vpc
   IPv4 CIDR block: 10.10.0.0/16
   Tenancy: Default
   Create VPC

   Internet Gateway:\

   VPC Console → Internet Gateways → Create internet gateway
   Name: Web App IGW
   Create internet gateway
   Actions → Attach to VPC
   Select: Web App-vpc
   Attach internet gateway

   Subnets:\
   
   Public Subnet 1:

    VPC Console → Subnets → Create subnet
    VPC: Web App-vpc
    Name: Web App-subnet-public-1
    Availability Zone: us-east-1a
    IPv4 CIDR block: 10.10.0.0/24
    Create subnet

    Repeat for the rest of the subnets below:\

    Public	    Web App-subnet-public2	     CIDR 10.10.1.0/24	Region us-east-1a	 Purpose --> NAT Gateway, Bastion host (For HA setup if required)\
    Private ECS	Web App-subnet-ecs-private1  CIDR	10.10.10.0/24	Region us-east-1a	 Purpose --> ECS Services, Internal ALB, APIGW VPCLink\
    Private ECS	Web App-subnet-ecs-private2	 CIDR 10.10.11.0/24	Region us-east-1a	 Purpose --> ECS Services, Internal ALB, APIGW VPCLink\
    Private DB	Web App-subnet-db-private3	 CIDR 10.10.20.0/24	Region us-east-1a	 Purpose --> RDS Primary\
    Private DB	Web App-subnet-db-private4	 CIDR 10.10.21.0/24	Region us-east-1a	 Purpose --> RDS Standby (For HA setup if required)


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
  Associate: Both private ECS subnets\
  
  Private Database Route Table:
  
  Create route table: Web App DB Pvt RT\
  No new route required\
  Associate: Both private database subnets\


  Authentication:

  Set up AWS Cognito User Pool and App Client for user authentication and authorization.

  Create User Pool:

  Go to AWS Cognito Console → User pools → Create user pool

  Define your application: Select Single-page application (SPA)
  
  Name for application: Web App (or choose another)
  
  Configure options:
  
  Options for sign-in identifiers: Select Email
  Self-registration: Enable
  Required attributes for sign-up: Select email and name
  Add a return URL: https://yourdomain.com (If you have a domain name, add here, else leave it blank)
  
  Click Create user directory


  Configure Cognito User Pool App Client:

  Go to your new User Pool → App integration tab → App clients
  Click on your app client name and Edit
  Under Authentication flows, enable:
  ALLOW_USER_PASSWORD_AUTH
  ALLOW_USER_SRP_AUTH
  ALLOW_REFRESH_TOKEN_AUTH
  Click Save changes


  Note down the following values in a notepad

  User Pool ID (e.g., us-east-1_xxxxxxxxx)\
  App Client ID (e.g., 1a2b3c4d5e6f7g8h9i0j1k2l3m)\
  Cognito Domain (User Pool -> Branding -> Domain)\


  Frontend Deployment:

  Set up the infrastructure for the React frontend, configure it with Cognito values, deploy it to S3 and access it through CloudFront. This allows to test login/signup functionality early.

  Tasks:
  -Create S3 bucket for hosting frontend build assets
  -Create CloudFront distribution with S3 origin
  -Configure CloudFront Root document and Custom Error Pages
  -Configure and Build React Application and Deploy to S3
  -Test login/signup functionality

  INSERT IMAGE HERE

  S3 Bucket Configuration:\
  S3 Console → Buckets → Create bucket -> General Purpose\
  Bucket name: web-app-bucket19 (must be unique)\
  Region: us-east-1 or your region (Make sure you are in the right AWS region for S3 console)\
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
  CloudFront Domain Name (e.g., d1234567890.cloudfront.net\


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

  Install dependencies:
  npm install\
  npm build

  Deploy frontend build to S3:

  aws s3 sync build/ s3://<your-frontend-bucket-name> --delete --exclude "images/*"

  Update Cognito Callback URL\
  
  Cognito Console → User pools → Web App User Pool
  App integration tab → App clients → Click your app client
  Edit Login pages settings:
  Allowed callback URLs: Add https://<your-cloudfront-domain>
  Allowed sign-out URLs: Add https://<your-cloudfront-domain>
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

  Create Products Table
  DynamoDB Console → Tables → Create table
  Table name: ecommerce-products
  Partition key: product_id (String)
  Sort key: Leave empty (no sort key needed)
  Table class: DynamoDB Standard
  Capacity mode: On-demand
  Create table


  Create Cart Table
  DynamoDB Console → Tables → Create table
  Table name: ecommerce-cart
  Partition key: user_id (String)
  Sort key: Leave empty (no sort key needed)
  Table class: DynamoDB Standard
  Capacity mode: On-demand
  Create table


  Load Sample Products Data:\
  cd data\
  bash update-product-image-urls.sh <cloudfront URL>

  Load Products into DynamoDB:\
  bash load-products.sh <your-region>

  Verify that DynamoDB table is updated:

  Go to DynamoDB -> ecommerce_products table and check if there are 20 products data with updated image URLs.

  RDS - PostgreSQL Database:

  Create DB Subnet Group
  RDS Console → Subnet groups → Create DB subnet group
  Name: ecommerce-db
  Description: "Subnet group for web app RDS"
  VPC: Select Web App-vpc
  Add subnets:
  Select both availability zones (us-east-1a, us-east-1b)
  Select both private database subnets
  Create

  Create Security Group for RDS
  VPC Console → Security Groups → Create security group
  Name: ecommerce-rds-sg
  Description: "Security group for RDS PostgreSQL"
  VPC: Select Web App-vpc
  Inbound rules:
  Type: PostgreSQL
  Port: 5432
  Source: Custom - 10.10.0.0/16 (VPC CIDR)
  Description: "Allow PostgreSQL from VPC"
  Outbound rules: Keep default (all traffic)
  Create


Create RDS Instance

RDS Console → Databases → Create database\
Engine options:\
Engine type: PostgreSQL\
Choose a database creation method: Full configuration\
Templates: Free Tier or Dev/Test

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

EC2 Console → Load Balancers → Create load balancer
Application Load Balancer → Create

Basic configuration:
Name: Web-App-LB
Scheme: Internal
IP address type: IPv4

Network mapping:
VPC: Web App-vpc
Subnets: Select both private ECS subnets
Security groups: Select web-ALB-SG
Listeners: HTTP:80
Default action: Forward to product-tg
Create load balancer

Configure ALB Listener Rules

Go to Load Balancer → Listeners → HTTP:80 → View/edit rules

Add rules for path-based routing:
Product Service Rule:
IF: Path is /products*
THEN: Forward to product-service-tg

Cart Service Rule:
IF: Path is /cart*
THEN: Forward to cart-service-tg

User Service Rule:
IF: Path is /users*
THEN: Forward to user-service-tg
Order Service Rule:

IF: Path is /orders*
THEN: Forward to order-service-tg

Leave all the weight as 1

Save rules
  
  
