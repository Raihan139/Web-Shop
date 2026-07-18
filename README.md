# Web-Shop

This production-ready, cloud-native e-commerce electronics platform leverages multiple AWS services to demonstrate a decoupled microservices architecture. The repository showcases a fully implemented production pipeline across the frontend, backend, database, access control, and system integration layers.

**Demo** - https://1drv.ms/v/c/f2627629f95424da/IQD_qtLtlVR6Ragt_d87oEwUAWFeQFDnUDArxsoYB9DMHTs?e=u9iW5j

**Architecture:**

<img width="793" height="859" alt="Web App Image" src="https://github.com/user-attachments/assets/c621ac48-1481-4f62-8c59-ca1c60b05054" />




**Infrastructure Architecture & AWS Service Catalog:**

**Edge & Content Delivery (Frontend):** Amazon S3 (static hosting), CloudFront (CDN), and Route 53 (DNS).

**API Routing & Ingress Layer:** API Gateway, VPC Links, and Application Load Balancers (ALB).

**Containerized Compute:** Amazon ECS orchestrated via AWS Fargate (serverless containers).

**Identity & Access Management:** AWS Cognito User Pools (CIAM).

**Data Tier (Databases):** Amazon DynamoDB (NoSQL) and RDS PostgreSQL (Relational).

**Event-Driven Messaging:** Amazon SNS (pub/sub), SQS (queuing), and SES (email delivery).

**Network Topology:** Amazon VPC with isolated Subnets, Security Groups, and NAT Gateways.

**Observability & Operations:** Amazon CloudWatch (logging/metrics) and AWS Systems Manager (SSM).

**Security & Governance:** AWS Identity and Access Management (IAM).


**Prerequisites: Ubuntu, AWS CLI, Docker, Git, Node.js**

**Steps:**

1. **Environment Setup & Prerequisites**\
   Enable WSL 2 (Windows Subsystem for Linux) and provision an Ubuntu distribution. Within the Ubuntu environment, install the     following core dependencies:\
   -**Git: Source control management.**\
   -**Docker Engine:** Container runtime utilized for building and publishing container images.\
   -**Node.js (v20+) & npm:** Runtime environment and package manager required for compilation of the React frontend.\
   -**AWS CLI v2:** Command-line interface configured for provisioning and managing AWS resources.

3. **Verify the installations using the commands below:**\
   aws --version\
   docker --version\
   node --version\
   npm --version\
   git --version

4. **Install and configure AWS CLI on your machine**\
   Check AWS website for instructions on installing and configuring AWS CLI

5. **Networking:**

   **Create public and private subnets across 2 availability zones (AZ) for the VPC infrastructure**

   **Note: Choose your AWS region and select the AZs accordingly.**

   **VPC** - CIDR block 10.10.0.0/16\
   **Public Subnets** - Allocated for public-facing edge infrastructure, 2 subnets for NAT Gateway and bastion host\
   **Private ECS Subnets** - 2 private subnets for containerized application services\
   **Private Database (DB) Subnets** - 2 private subnets for PostgreSQL DB instances\
   **Internet Gateway** - Provides internet access for the public subnets\
   **NAT Gateway** - For internet access for the private subnets\
   **Route Tables** - Manage traffic routing

   **Network Setup**

<img width="802" height="651" alt="Web App Network" src="https://github.com/user-attachments/assets/30dd5b25-56a9-48a3-9810-3824947bda8a" />


   **VPC:**

  ### Step 1: Create the VPC
1. Navigate to the **VPC Console**, select **Your VPCs**, and click **Create VPC**.
2. Set the **Name** to `Web App-vpc`.
3. Enter `10.10.0.0/16` for the **IPv4 CIDR block**.
4. Keep the **Tenancy** as `Default` and click **Create VPC**.

### Step 2: Create and Attach the Internet Gateway
1. Navigate to **Internet Gateways** and click **Create internet gateway**.
2. Set the **Name** to `Web App IGW` and click **Create internet gateway**.
3. Click **Actions**, select **Attach to VPC**, choose `Web App-vpc`, and click **Attach internet gateway**.

### Step 3: Create the Public Subnet
1. Navigate to **Subnets** and click **Create subnet**.
2. Select `Web App-vpc` as the target **VPC**.
3. Set the **Name** to `Web App-subnet-public-1`.
4. Choose `us-east-1a` for the **Availability Zone**.
5. Enter `10.10.0.0/24` for the **IPv4 CIDR block** and click **Create subnet**.


    Repeat for the rest of the subnets below:

    Public	      Web App-subnet-public2	       CIDR 10.10.1.0/24	Region us-east-1a	 Purpose  NAT Gateway, Bastion host (For HA setup if required)
    Private ECS	Web App-subnet-ecs-private1    CIDR	10.10.10.0/24	Region us-east-1a	 Purpose  ECS Services, Internal ALB, APIGW VPCLink
    Private ECS	Web App-subnet-ecs-private2	 CIDR 10.10.11.0/24	Region us-east-1a	 Purpose  ECS Services, Internal ALB, APIGW VPCLink
    Private DB	   Web App-subnet-db-private3	    CIDR 10.10.20.0/24	Region us-east-1a	 Purpose  RDS Primary
    Private DB	   Web App-subnet-db-private4	    CIDR 10.10.21.0/24	Region us-east-1a	 Purpose  RDS Standby (For HA setup if required)


  ### Step 4: Create a NAT Gateway
1. Navigate to the **VPC Console**, select **NAT Gateways**, and click **Create NAT gateway**.
2. Set the **Name** to `Web-App-GW`.
3. Set the **Connectivity type** to `Public` and **Availability Mode** to `Zonal`.
4. Select `Web App-subnet-public-1` as the **Subnet**.
5. Click **Allocate Elastic IP** to assign an IP, then click **Create NAT gateway**.

### Step 5: Configure Route Tables

#### Public Route Table
1. Navigate to **Route Tables** and click **Create route table**.
2. Set the **Name** to `Web App-RT`, select `Web App-vpc`, and click **Create route table**.
3. Under the **Routes** tab, click **Edit routes**, then click **Add route**:
   * **Destination:** `0.0.0.0/0`
   * **Target:** `Internet Gateway` (Select `Web App IGW`)
4. Click **Save changes**.
5. Under the **Subnet associations** tab, click **Edit subnet associations**, select both public subnets, and click **Save associations**.

#### Private ECS Route Table
1. Click **Create route table**, name it `Web App Pvt RT`, and select `Web App-vpc`.
2. Under **Edit routes**, add a route:
   * **Destination:** `0.0.0.0/0`
   * **Target:** `NAT Gateway` (Select `Web-App-GW`)
3. Under **Edit subnet associations**, select both private ECS subnets and save.

#### Private Database Route Table
1. Click **Create route table**, name it `Web App DB Pvt RT`, and select `Web App-vpc`.
2. Leave the routes as default (no internet/NAT route required).
3. Under **Edit subnet associations**, select both private database subnets and save.

### Step 6: Configure Authentication (AWS Cognito)
Set up an AWS Cognito User Pool and App Client to manage user authentication and authorization.

1. Navigate to the **AWS Cognito Console**, select **User pools**, and click **Create user pool**.
2. Under **Configure sign-in experience**, select **Single-page application (SPA)**.
3. Provide a **User pool name** (e.g., `Web App`) and complete the creation wizard.

  
  ### Step 7: Configure Cognito User Pool Options
1. Under **Configure sign-in experience**, select **Email** for the sign-in identifiers.
2. Ensure **Self-registration** is enabled.
3. For **Required attributes**, select both **email** and **name**.
4. Add your **Return URL** (e.g., `https://yourdomain.com`) or leave it blank if you do not have one yet.
5. Click **Create user pool** (or **Create user directory**) to finish the initial setup.

### Step 8: Configure Cognito App Client Settings
1. Open your newly created **User Pool**.
2. Navigate to the **App integration** tab and scroll down to the **App clients** section.
3. Click on your specific app client name and select **Edit**.
4. Under **Authentication flows**, make sure the following are enabled:
   * `ALLOW_USER_PASSWORD_AUTH`
   * `ALLOW_USER_SRP_AUTH`
   * `ALLOW_REFRESH_TOKEN_AUTH`
5. Leave all other settings at their default values and click **Save changes**.

### Step 9: Save Required Environment Variables
Note down the following configuration values from the console. You will need them for your application's environment variables (`.env` file):

* **User Pool ID** (Found at the top of your user pool overview, e.g., `us-east-1_xxxxxxxxx`)
* **App Client ID** (Found under the App integration tab, e.g., `1a2b3c4d5e6f7g8h9i0j1k2l3m`)
* **Cognito Domain** (Found under **App integration** -> **Branding** -> **Domain**)


### Step 10: Frontend Deployment
Set up the infrastructure for the React frontend, configure it with the Cognito values, deploy it to Amazon S3, and serve it securely through Amazon CloudFront. This allows you to test the login and signup functionality early in the deployment process.

#### Key Tasks
* **Create an S3 Bucket** to host the static frontend build assets.
* **Create a CloudFront Distribution** pointing to the S3 bucket as its origin.
* **Configure CloudFront** root documents and custom error pages for single-page app (SPA) routing.
* **Configure and Build** the React application, then upload the build folder to S3.
* **Test the live URL** to verify that login and signup workflows work correctly.


<img width="517" height="240" alt="CloudFront WebApp" src="https://github.com/user-attachments/assets/c3ab4f1f-c14c-49aa-8258-29eaeff48086" />

### Step 11: Create the Amazon S3 Bucket
1. Navigate to the **S3 Console**, select **Buckets**, and click **Create bucket**.
2. Under **Bucket type**, choose **General Purpose**.
3. Set the **Bucket name** to `web-app-bucket19` (or another globally unique name).
4. Select `us-east-1` (or your preferred region) as the **AWS Region**.
5. Keep **Block *all* public access** checked (CloudFront will access this bucket privately).
6. Keep **Bucket Versioning** disabled.
7. Under **Default encryption**, ensure **Server-side encryption with Amazon S3 managed keys (SSE-S3)** is enabled.
8. Click **Create bucket**.

### Step 12: Create the CloudFront Distribution
1. Navigate to the **CloudFront Console**, select **Distributions**, and click **Create distribution**.
2. Set the **Distribution name** to `Web App CloudFront`.
3. Select **Single website or app** and click **Next**.
4. For **Origin type**, choose **Amazon S3**.
5. For **Origin domain**, select your newly created frontend S3 bucket from the list.
6. Under **Origin access**, select **Origin access control settings (recommended)** to allow private S3 bucket access to CloudFront.
7. Under **Cache behavior**, select **Use recommended cache settings** tailored to serving S3 content and click **Next**.
8. Under **Web Application Firewall (WAF)**, choose **Do not enable security protections** for this setup.
9. Click **Create distribution**.

### Step 13: Configure Root Document and Custom Error Pages
1. Select your new CloudFront distribution, go to the **General** tab, and click **Edit**.
2. Update the **Default root object** field to `index.html` and click **Save changes**.
3. Switch to the **Error pages** tab and click **Create custom error response**.
4. Configure the custom error with the following settings to support single-page application (SPA) routing:
   * **HTTP error code:** `403: Forbidden`
   * **Customize error response:** Select `Yes`
   * **Response page path:** `/index.html`
   * **HTTP response code:** `200: OK`
5. Click **Create**

6. Repeat for HTTP error code 404

  Save the following values:

  CloudFront Distribution ID (e.g., E30JU8N49IUDRS)\
  CloudFront Domain Name (e.g., d1234567890.cloudfront.net)

### Step 14: Configure and Build the React Application
1. Open your terminal and navigate to the frontend directory on your local machine:
   ```bash
   cd frontend/react-app
   ```
2. Open the configuration file located at `src/aws-config.js` and update it with the Cognito values you saved earlier:
   ```javascript
   const awsConfig = {
     Auth: {
       Cognito: {
         userPoolId: '<COGNITO_USER_POOL_ID>',       // Replace with your User Pool ID
         userPoolClientId: '<COGNITO_CLIENT_ID>',    // Replace with your App Client ID
         loginWith: {
           email: true,
         },
       }
     },
     API: {
       baseUrl: ''  // Leave empty for now; this will be updated later
     }
   };
   
   export default awsConfig;
   ```

### Step 15: Compile and Deploy Frontend to S3
1. Install the project dependencies and compile the production build:
   ```bash
   npm install
   npm run build
   ```
2. Deploy the compiled static assets to your S3 bucket using the AWS CLI:
   ```bash
   aws s3 sync build/ s3://<your-frontend-bucket-name> --delete --exclude "images/*"
   ```

### Step 16: Update Cognito Callback URLs
1. Navigate to the **Cognito Console**, select **User pools**, and click on your **Web App User Pool**.
2. Go to the **App integration** tab, scroll down to **App clients**, and click on your specific app client.
3. Locate the **Login pages** section and click **Edit**.
4. Configure the redirection endpoints for your application:
   * **Allowed callback URLs:** Add `https://<your-cloudfront-domain>`
   * **Allowed sign-out URLs:** Add `https://<your-cloudfront-domain>`
5. Click **Save changes**

  ### Step 17: Test Login & Signup Functionality
1. Open your browser and navigate to your secure CloudFront endpoint: `https://<your-cloudfront-domain>`
2. Test the client-side authentication loops to verify the baseline setup:
   * **Working Features:** User sign-up (via email), one-time email verification workflows, and seamless session log-in/log-out.
   * **Pending Features:** Product catalogs, shopping cart modifications, and checkout structures will throw errors until you finish linking the API Gateway and backend nodes.

### Step 18: Initialize the Data Storage Layer

#### Populate Product Imagery (S3)
1. Use the below script to upload sample images from the data/product-images/ directory to the S3 bucket:
   ```bash
   cd data
   bash upload-images-to-s3.sh <your-bucket-name>
   ```
2. Verify that the images are publicly accessible over the internet via a browser using the CloudFront URL:
   * *Example:* `https://<your-cloudfront-domain>/images/products/prod-001.jpg`

#### Configure DynamoDB
1. Open the **DynamoDB Console**, select **Tables**, and click **Create table** to spin up the **Products Inventory**:
   * **Table name:** `ecommerce-products`
   * **Partition key:** `product_id` (Type: `String`)
   * **Sort key:** Leave blank
   * **Table class:** `DynamoDB Standard`
   * **Capacity mode:** `On-demand`
   * Click **Create table**.
2. Click **Create table** again to spin up the stateful persistent **User Carts**:
   * **Table name:** `ecommerce-cart`
   * **Partition key:** `user_id` (Type: `String`)
   * **Sort key:** Leave blank
   * **Table class:** `DynamoDB Standard`
   * **Capacity mode:** `On-demand`
   * Click **Create table**.

### Step 54: Format and Prepare Sample Product Data
The repository includes a sample data payload file located at `data/products.json` containing 20 pre-configured product records. Individual item data blocks are structured using the following JSON schema:

```json
{
  "product_id": "prod-001",
  "name": "Wireless Bluetooth Headphones",
  "description": "Premium noise-cancelling over-ear headphones",
  "price": 89.99,
  "stock": 150,
  "image_url": "https://example.com/images/products/prod-001.jpg",
  "category": "Electronics"
}
```

#### Important Modification Instruction
Because the default `image_url` property values point to placeholder destination endpoints, you must patch this data map with your real application infrastructure links before running database population routines. 

Ensure that you replace the dummy values with the actual **CloudFront Domain CDN URL** that you generated and verified during your S3 asset upload configuration steps (e.g., `https://<your-cloudfront-domain>/images/products/prod-001.jpg`).

1. Update the product image URLs using the following commands:
   ```bash
   cd data
   bash update-product-image-urls.sh <your-cloudfront-domain>
   ```
2. Now let's upload the products into DynamoDB:
   ```bash
   bash load-products.sh <your-aws-region>
   ```
3. Navigate to **DynamoDB** -> **Tables** -> `ecommerce-products` in the AWS console and click **Explore table items** to confirm that all 20 structural data assets successfully populated with targeted image links.

### Step 19: Provision Relational Database Storage (Amazon RDS - PostgreSQL)

#### 1. Define the DB Subnet Group
1. Open the **RDS Console**, click **Subnet groups** from the left navigation panel, and click **Create DB subnet group**.
2. Name the group `web-app-db-subnet-private 1` and set the description to `"Subnet group for web app RDS"`.
3. Choose `Web App-vpc` from the dropdown list.
4. Under **Add subnets**, pick your target Availability Zones (e.g., `us-east-1a` and `us-east-1b`) and carefully check the checkboxes corresponding to your two isolated **private database subnets**.
5. Click **Create**.

#### 2. Establish Network Guardrails (Security Groups)
1. Head back to the **VPC Console**, go to **Security Groups**, and choose **Create security group**.
2. Set the configuration details as follows:
   * **Name:** `web-app-rds-sg`
   * **Description:** `"Security group for RDS PostgreSQL"`
   * **VPC:** `Web App-vpc`
3. Click **Add rule** under the **Inbound rules** table block:
   * **Type:** `PostgreSQL` (Port `5432`)
   * **Source:** Select `Custom` and type `10.10.0.0/16` (Your main VPC CIDR Block)
   * **Description:** `"Allow PostgreSQL from VPC"`
4. Keep the **Outbound rules** set to their standard defaults (Allow all traffic) and click **Create security group**.

#### 3. Spin up the Relational DB Instance
1. Head over to the **RDS Console**, select **Databases**, and choose **Create database**.
2. Customize the database wizard parameters precisely:
   * **Database creation method:** Select `Full configuration`
   * **Engine type:** Select `PostgreSQL`
   * **Engine version:** Select the stable release `PostgreSQL 18.3-R1` or latest
   * **Templates:** Choose `Free Tier` *(this defaults Availability and Durability to Single-AZ)*
3. Complete the **Settings** configuration panel:
   * **DB instance identifier:** `ecommercedb-instance`
   * **Master username:** `postgres`
   * **Master password:** *Define a strong password and save it securely in your password vault.*
   * **Database authentication:** Select `Password authentication`
4. Define the physical system resource footprint and networking:
   * **DB instance class:** Choose `Burstable classes` -> `db.t4g.micro`
   * **VPC:** Select `Web App-vpc`
   * **DB subnet group:** Select your newly generated data group `web-app-db-subnet-private 1`
   * **Public access:** Select `No`
   * **VPC security group:** Choose `Choose existing` -> Attach `web-app-rds-sg` *(Ensure you remove the 'default' group)*
   * **Availability Zone:** Bind to your primary zone (e.g., `us-east-1a`)
5. Under **Monitoring**, uncheck the **Enable Performance Insights** toggle box.
6. Open the **Additional configuration** at the very bottom *(Crucial Step)*:
   * **Initial database name:** Type `ecommercedb`
   * **Backup:** Uncheck **Enable automated backups**
   * **Encryption:** Uncheck **Enable encryption**
7. Click **Create database**. *The initial compilation run will take roughly 5 to 10 minutes to spin up clean endpoints.*

### Step 20: Configure Systems Manager Parameter Store
Store your environment variables centrally. The microservices automatically fetch these configurations at runtime.

1. Navigate to the **Systems Manager Console**, select **Parameter Store**, and click **Create parameter**.
2. Create the following parameters:

| Parameter Name | Type | Value / Source |
| :--- | :--- | :--- |
| `/ecommerce/dev/aws/region` | `String` | Your target AWS region (e.g., `us-east-1`) |
| `/ecommerce/dev/db/host` | `String` | Your RDS endpoint (Found in **RDS Console** → **Databases** → `ecommercedb-instance`) |
| `/ecommerce/dev/db/password` | `SecureString` | The master database password you created |

---

### Step 21: Deploy Backend Infrastructure (ECS & Internal ALB)
Deploy the backend microservices as Docker containers on Amazon ECS via AWS Fargate. An internal Application Load Balancer (ALB) handles routing between services securely inside the private subnets.

#### 1. Create the ALB Security Group
1. Navigate to the **EC2 Console**, select **Security Groups**, and click **Create security group**.
2. Configure the basic details:
   * **Name:** `web-ALB-SG`
   * **Description:** `"Security group for internal ALB"`
   * **VPC:** Select `Web App-vpc`
3. Add an **Inbound rule**:
   * **Type:** `HTTP` (Port `80`)
   * **Source:** Select `Custom` and enter `10.10.0.0/16`
   * **Description:** `"Allow HTTP from VPC"`
4. Keep **Outbound rules** set to their standard defaults (Allow all traffic) and click **Create security group**.

#### 2. Pre-create the Service Target Groups
Before launching the load balancer, create four separate IP-based target groups for the microservices. Navigate to **EC2 Console** → **Target Groups** → **Create target group**, select **IP addresses** as the target type, and use the following parameters for each:

* **Product Service Target Group:**
  * **Name:** `product-tg` | **Port:** `8001` | **VPC:** `Web App-vpc` | **Health check path:** `/health`
* **Cart Service Target Group:**
  * **Name:** `cart-tg` | **Port:** `8002` | **VPC:** `Web App-vpc` | **Health check path:** `/health`
* **User Service Target Group:**
  * **Name:** `user-tg` | **Port:** `8003` | **VPC:** `Web App-vpc` | **Health check path:** `/health`
* **Order Service Target Group:**
  * **Name:** `order-tg` | **Port:** `8004` | **VPC:** `Web App-vpc` | **Health check path:** `/health`

#### 3. Provision the Internal Application Load Balancer
1. Navigate to the **EC2 Console**, select **Load Balancers**, and click **Create load balancer**.
2. Select **Application Load Balancer** and click **Create**.
3. Complete the configuration wizard:
   * **Name:** `Web-App-LB`
   * **Scheme:** Select `Internal` *(Crucial: This keeps traffic inside your private network)*
   * **IP address type:** `IPv4`
4. Configure **Network mapping**:
   * **VPC:** Select `Web App-vpc`
   * **Subnets:** Select your **two private ECS subnets**
5. Configure **Security groups & Listeners**:
   * **Security groups:** Select `web-ALB-SG`
   * **Listeners:** Keep `HTTP:80` and set the default action to **Forward to** `product-tg`.
6. Click **Create load balancer**.

#### 4. Configure Path-Based Routing Listener Rules
1. Select your new load balancer, go to the **Listeners** tab, select the `HTTP:80` listener, and click **View/edit rules**.
2. Add four specific path-based conditional routing rules:

| Condition (IF) | Action (THEN) | Weight |
| :--- | :--- | :--- |
| **Path is** `/products*` | **Forward to** `product-tg` | `1` |
| **Path is** `/cart*` | **Forward to** `cart-tg` | `1` |
| **Path is** `/users*` | **Forward to** `user-tg` | `1` |
| **Path is** `/orders*` | **Forward to** `order-tg` | `1` |

3. Save the listener rule changes.

#### 5. Register Microservice Discovery Over the ALB
1. Copy the **DNS name** generated for your new `Web-App-LB` from the load balancer description screen.
2. Return to the **Parameter Store** and save the base URLs for your microservices so they can talk to each other through the internal load balancer:

| Parameter Name | Type | Value |
| :--- | :--- | :--- |
| `/ecommerce/dev/user-service-url` | `String` | `http://<your-internal-alb-dns-name>` |
| `/ecommerce/dev/cart-service-url` | `String` | `http://<your-internal-alb-dns-name>` |
| `/ecommerce/dev/product-service-url` | `String` | `http://<your-internal-alb-dns-name>` |
| `/ecommerce/dev/order-service-url` | `String` | `http://<your-internal-alb-dns-name>` |

Note: Every backend service shares the identical internal ALB DNS name. Traffic is automatically directed to the correct microservice based on the path-based routing rules configured on the load balancer listener.

### Step 22: Create Amazon ECR Repositories
1. Navigate to the **Amazon ECR Console**, select **Repositories**, and click **Create repository**.
2. Create repositories for all four microservices using the naming conventions listed below:

| Microservice | Target Repository Name |
| :--- | :--- |
| **Product Service** | `ecommerce/product-service` |
| **Cart Service** | `ecommerce/cart-service` |
| **User Service** | `ecommerce/user-service` |
| **Order Service** | `ecommerce/order-service` |

---

### Step 23: Build, Tag, and Push Docker Images
> ⚠️ **Note:** Run these build and deployment commands from your local computer terminal, not from inside the AWS Management Console or an EC2 instance.

#### 1. Authenticate Your Local Docker Client
Go to the **ECR Console**, open any repository, and copy your account's regional ECR URI registry prefix (everything before the repository name string). Log into your private registry with the AWS CLI:
```bash
aws ecr get-login-password --region <your-region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<your-region>.amazonaws.com
```

#### 2. Publish Product Service
```bash
cd services/product-service
docker build -t ecommerce/product-service .
docker tag ecommerce/product-service:latest <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/product-service:latest
docker push <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/product-service:latest
```

#### 3. Publish Cart Service
```bash
cd ../cart-service
docker build -t ecommerce/cart-service .
docker tag ecommerce/cart-service:latest <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/cart-service:latest
docker push <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/cart-service:latest
```

#### 4. Publish User Service
```bash
cd ../user-service
docker build -t ecommerce/user-service .
docker tag ecommerce/user-service:latest <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/user-service:latest
docker push <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/user-service:latest
```

#### 5. Publish Order Service
```bash
cd ../order-service
docker build -t ecommerce/order-service .
docker tag ecommerce/order-service:latest <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/order-service:latest
docker push <account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/order-service:latest
```

---

### Step 24: Provision ECS Task IAM Permissions
Assign the necessary operational resource access rules to your microservice container runtime.

1. Navigate to the **IAM Console**, select **Roles**, and click **Create role**.
2. Select **AWS service** as the trusted entity type.
3. Set the service use case dropdowns to **Elastic Container Service** followed by **Elastic Container Service Task**, and click **Next**.
4. Check the boxes to link these standard AWS managed access policies:
   * `AmazonDynamoDBFullAccess_v2`
   * `AmazonSSMReadOnlyAccess`
   * `CloudWatchLogsFullAccess`
   * `AmazonS3ReadOnlyAccess`
   * `AmazonSNSFullAccess`
5. Name the role `web-app-ecs-task-role` and click **Create role**.

---

### Step 25: Create the ECS Tasks Security Group
Isolate your container computational layer by creating a restrictive traffic routing boundary.

1. Open the **VPC Console**, select **Security Groups**, and click **Create security group**.
2. Set the structural details:
   * **Name:** `web-app-ecs-sg`
   * **Description:** `"Security group for ECS tasks"`
   * **VPC:** Select `Web App-vpc`
3. Create four distinct **Inbound rules** mapped exclusively to your load balancer entry point:
   * **Custom TCP** | Port `8001` | **Source:** `web-ALB-SG` (or `ecommerce-alb-sg`)
   * **Custom TCP** | Port `8002` | **Source:** `web-ALB-SG` (or `ecommerce-alb-sg`)
   * **Custom TCP** | Port `8003` | **Source:** `web-ALB-SG` (or `ecommerce-alb-sg`)
   * **Custom TCP** | Port `8004` | **Source:** `web-ALB-SG` (or `ecommerce-alb-sg`)
4. Keep the **Outbound rules** set to their standard defaults (Allow all traffic) and click **Create security group**.

---

### Step 26: Define the Product Service ECS Task Profile
1. Navigate to the **Amazon ECS Console**, select **Task definitions**, and click **Create new task definition**.
2. Define the basic application structure parameters:
   * **Task definition family:** `web-app-product-service`
   * **Launch type:** `AWS Fargate`
   * **Operating system/Architecture:** `Linux/X86_64`
   * **Task CPU:** `1 vCPU`
   * **Task Memory:** `3 GB`
   * **Task role:** `web-app-ecs-task-role`
   * **Task execution role:** Select the option to create a default role (`ecsTaskExecutionRole`). *You will reuse this automatic execution role for the other remaining services.*
3. Configure the **Container definition** properties:
   * **Container name:** `product-service`
   * **Image URI:** `<account-id>.dkr.ecr.<your-region>.amazonaws.com/ecommerce/product-service:latest`
   * **Port mappings:** Container port `8001` | Protocol `TCP`
4. Add the local runtime lifecycle environment variables:
   * `ENVIRONMENT` = `dev`
   * `AWS_REGION` = `<your-region>`
5. Turn on the **Log configuration** framework:
   * **Log driver:** `awslogs`
   * **Log group:** `/ecs/product-service`
   * **Region:** `<your-region>`
   * **Stream prefix:** `ecs`
6. Click **Create**.

Note: Repeat these exact configuration steps to create task definitions for the Cart, User, and Order services. Make sure to adjust the container names, port numbers, image URIs, and CloudWatch log groups to match each specific microservice layout.

### Step 27: ECS Task Definitions Overview
Ensure you have created a task definition for each of your microservices using the specifications below:

| Service | Task Definition Family | CPU | Memory | Port |
| :--- | :--- | :--- | :--- | :--- |
| **Product Service** | `web-app-product-service` | 1 vCPU | 3 GB | 8001 |
| **Cart Service** | `web-app-cart-service` | 1 vCPU | 3 GB | 8002 |
| **User Service** | `web-app-user-service` | 1 vCPU | 3 GB | 8003 |
| **Order Service** | `web-app-order-service` | 1 vCPU | 3 GB | 8004 |

---

### Step 28: Spin up the ECS Cluster and Services

#### 1. Create the ECS Cluster
1. Navigate to the **Amazon ECS Console**, select **Clusters**, and click **Create cluster**.
2. Set the **Cluster name** to `web-app-cluster`.
3. Under **Infrastructure**, select **AWS Fargate (serverless)** only.
4. Click **Create**.

#### 2. Provision the Microservices
Navigate to your new `web-app-cluster`, go to the **Services** tab, and click **Create**. Use the following reference table to deploy all four microservices to the cluster:

| Parameter | Product Service | Cart Service | User Service | Order Service |
| :--- | :--- | :--- | :--- | :--- |
| **Compute options** | Launch type (Fargate) | Launch type (Fargate) | Launch type (Fargate) | Launch type (Fargate) |
| **Task Definition** | `web-app-product-service:1` | `web-app-cart-service:1` | `web-app-user-service:1` | `web-app-order-service:1` |
| **Service Name** | `web-app-product-service` | `web-app-cart-service` | `web-app-user-service` | `web-app-order-service` |
| **Desired Tasks** | `1` | `1` | `1` | `1` |
| **VPC** | `Web App-vpc` | `Web App-vpc` | `Web App-vpc` | `Web App-vpc` |
| **Subnets** | Both private ECS subnets | Both private ECS subnets | Both private ECS subnets | Both private ECS subnets |
| **Security Group** | `web-app-ecs-sg` | `web-app-ecs-sg` | `web-app-ecs-sg` | `web-app-ecs-sg` |
| **Public IP** | Turned off | Turned off | Turned off | Turned off |
| **Load Balancing** | Enable Load Balancing | Enable Load Balancing | Enable Load Balancing | Enable Load Balancing |
| **Load Balancer** | `web-app-internal-alb` | `web-app-internal-alb` | `web-app-internal-alb` | `web-app-internal-alb` |
| **Target Group** | `product-service-tg` | `cart-service-tg` | `user-service-tg` | `order-service-tg` |

---

### Step 29: Validate Deployment Health Status

#### 1. Monitor Container Lifecycle
Navigate to **ECS Console** → **Clusters** → `web-app-cluster` → **Services**. Confirm that all four microservices match the following parameters:
* **Status:** `Active`
* **Running tasks:** `1`
* **Desired tasks:** `1`

#### 2. Audit Target Routing Groups
Navigate to **EC2 Console** → **Load Balancing** → **Target Groups**. Inspect each target group and confirm:
* **Registered targets:** `1`
* **Health status:** `Healthy` (Passed initial HTTP `/health` probes)

---

### Step 30: End-to-End API Integration Testing
Because the Application Load Balancer is strictly internal, you cannot access its URL from the open internet. We will deploy a temporary public Bastion Host to test the microservices and terminate it immediately after verification.

#### 1. Spin up the Bastion Host
1. Navigate to the **EC2 Console** and click **Launch instance**.
2. Configure the system parameters:
   * **Name:** `web-app-bastion`
   * **AMI:** `Amazon Linux 2023`
   * **Instance type:** `t3.micro`
   * **Key pair:** Select an existing key pair or generate a new one
3. Modify the **Network settings**:
   * **VPC:** `Web App-vpc`
   * **Subnet:** Select any **public subnet**
   * **Auto-assign public IP:** Select `Enable`
   * **Security group:** Choose **Create security group**
   * **Security group name:** `web-app-bastion-sg`
   * **Inbound rule:** `SSH` (Port 22) | **Source:** Select `My IP`
4. Click **Launch instance**.

#### 2. Execute Local API Route Testing
1. Connect to your newly deployed ec2 instance via SSH:
   ```bash
   ssh -i your-key.pem ec2-user@<bastion-public-ip>
   ```
2. Run a curl command against the internal routing endpoint to pull the live database catalogs:
   ```bash
   curl http://<internal-alb-dns-name>/products
   ```
3. If everything is configured correctly, the terminal will return a JSON list containing your 20 live product inventory entries.

#### 3. Cleanup Resources
> ⚠️ **Important:** To prevent unnecessary billing charges, navigate back to the **EC2 Console**, select `web-app-bastion`, and choose **Instance State** → **Terminate instance**. This server is no longer needed.

### Step 31: Infrastructure Troubleshooting Guide
If any of your microservices fail to boot up or crash during testing, use the following isolation steps to diagnose and repair your deployment.

#### 1. Audit Runtime System Diagnostics (CloudWatch Logs)
When a task fails to reach a steady `Running` state, the internal container stdout will capture the underlying error. Check your log streams directly:
1. Navigate to the **CloudWatch Console** and click on **Log groups** under the Logs menu.
2. Search and monitor the dedicated streams for your specific failing microservice:
   * `/ecs/product-service`
   * `/ecs/cart-service`
   * `/ecs/user-service`
   * `/ecs/order-service`

#### 2. Resolving Boot Failures (Service Stuck in Pending/Crashing)
* **Verify ECR Image URIs:** Double-check that your active ECS Task Definition references the exact image address string generated by your private ECR registry.
* **Audit Active Environment Keys:** Open your container definition wizard and ensure that baseline runtime keys (like `ENVIRONMENT` or `AWS_REGION`) are fully mapped.
* **Validate IAM Policy Attachment:** Verify that the `web-app-ecs-task-role` is properly assigned to the task definition profile so containers have legal credentials to run.

#### 3. Fixing Load Balancer Probe Drops (Health Check Failures)
* **Validate Code Routes:** Confirm that a lightweight `/health` routing endpoint exists and returns an HTTP status `200 OK` within your application source code.
* **Review Network Access Rules:** Confirm that your `web-app-ecs-sg` security group includes active inbound TCP permissions on ports `8001`–`8004` that match the source group `web-ALB-SG`.

#### 4. Debugging System Variable Fetches (Parameter Store Drops)
* **Check Key Casing:** Systems Manager keys are explicitly **case-sensitive**. Ensure strings like `/ecommerce/dev/db/host` match perfectly in your service lookup files.
* **Confirm Regional Boundaries:** Verify that your global deployment parameter strings were published directly inside the active region (e.g., `us-east-1`) rather than a different default setup.

### Step 32: Deploy the Public API Gateway
Provision an Amazon API Gateway (HTTP API) to link with your internal Application Load Balancer via a VPC Link. This acts as the public entry point for your microservices while implementing JWT authentication through Amazon Cognito.

#### Route Architecture Setup
* **`GET /products`** $\rightarrow$ Routes to **Product Service** (Public / Unauthenticated).
* **`ANY /{proxy+}`** $\rightarrow$ Routes to **All Services** (Protected / Requires Cognito JWT Token).
* **`OPTIONS /{proxy+}`** $\rightarrow$ Handles **CORS Preflight** (Public / Unauthenticated).

---

### Step 33: Configure the VPC Link Component

#### 1. Establish the Network Access Control Group
1. Open the **VPC Console**, select **Security Groups**, and click **Create security group**.
2. Complete the standard metadata options:
   * **Name:** `web-app-vpclink-sg`
   * **Description:** `"Security group for VPC Link to ALB"`
   * **VPC:** Select your primary network `Web App-vpc`
3. Create two inbound rules to permit proxy traffic:
   * **HTTP** | Port `80` | **Source:** `0.0.0.0/0`
   * **HTTPS** | Port `443` | **Source:** `0.0.0.0/0`
4. Leave the outbound rule default tracking enabled (Allow all traffic) and click **Create security group**.

#### 2. Provision the VPC Private Link Bridge
1. Open the **API Gateway Console**, select **VPC Links** from the left-side navigation panel, and click **Create**.
2. Choose **VPC Link for HTTP APIs (v2)**.
3. Configure the link parameters:
   * **Name:** `web-app-vpc-link`
   * **VPC:** Select `Web App-vpc`
   * **Subnets:** Select your **two private ECS subnets** (`web-app-private-ecs-1` & `web-app-private-ecs-2`)
   * **Security groups:** Attach your newly generated `web-app-vpclink-sg`
4. Click **Create**. 
> ⏳ **Note:** Establishing a VPC Link takes between 5 to 10 minutes. Wait until the dashboard status turns green and reads **Available** before starting the next configuration phase.

---

### Step 34: Spin up the HTTP API Gateway
1. Navigate to the **API Gateway Console**, select **APIs**, and click **Create API**.
2. Find the **HTTP API** card options block and click **Build**.
3. Name your instance `web-app-api` and click **Next**.
4. Skip adding any initial integrations on this screen; click **Next** to proceed and click **Create**.
5. From the left navigation menu, expand your API settings, go to **Stages**, and click **Create**.
6. Set the parameters for your default deployment environment:
   * **Stage name:** `$default`
   * **Auto-deploy:** Ensure this toggle box is checked
7. Click **Create**.

---

### Step 35: Attach HTTP Integration
1. From the left panel under your API settings, choose **Develop** $\rightarrow$ **Integrations** $\rightarrow$ **Manage integrations** and click **Create**.
2. Complete the resource target mapping details:
   * **Integration type:** `Private resource`
   * **Method mapping selection:** Click **Select Manually**
   * **Target service:** `ALB/NLB`
   * **Load balancer:** Select your internal resource engine `Web App-ALB`
   * **Listener:** Choose `HTTP:80`
   * **VPC Link:** Select `web-app-vpc-link`
3. Click **Create integration**. This unified backend bridge will service your downstream path layouts.

---

### Step 36: Configure the Cognito JWT Authorizer
Protect your write endpoints and sensitive business routes using Cognito security profiles.

1. Inside your active API configuration tree, click **Authorization** under the Develop sub-menu, select the **Authorizers** tab, and click **Create**.
2. Configure your validation settings:
   * **Name:** `cognito-jwt-authorizer`
   * **Authorizer type:** `JWT`
   * **Identity source:** `$request.header.Authorization`
   * **Issuer URL:** `https://cognito-idp.<your-region>.amazonaws.com/<user-pool-id>`
   * **Audience:** Enter your private `<your-app-client-id>` key string saved from Step 9
3. Click **Create authorizer**.

### Step 37: Map API Gateway Routes
Define how incoming public traffic is structured and secured. Navigate to **Develop** $\rightarrow$ **Routes** and click **Create** to establish the following three pathways:

#### Route 1: Public Products Catalog
* **Method:** `GET`
* **Resource path:** `/products`
* **Integration:** Select your existing ALB Integration
* **Authorization:** `None` (Public access)

#### Route 2: Protected Application Proxy
* **Method:** `ANY`
* **Resource path:** `/{proxy+}`
* **Integration:** Select your existing ALB Integration
* **Authorization:** `JWT`
* **Authorizer:** Select `cognito-jwt-authorizer`

#### Route 3: CORS Preflight Route
* **Method:** `OPTIONS`
* **Resource path:** `/{proxy+}`
* **Integration:** Select your existing ALB Integration
* **Authorization:** `None` (Public access)

---

### Step 38: Configure Cross-Origin Resource Sharing (CORS)

1. Navigate to **Develop** $\rightarrow$ **CORS** and click **Configure**.
2. Apply the following development settings:
   * **Access-Control-Allow-Origin:** `*` *(or bind strictly to your static CloudFront domain name)*
   * **Access-Control-Allow-Headers:** `*` *(Permitting all headers ensures custom `Authorization` JWT tokens route cleanly without blocking)*
   * **Access-Control-Allow-Methods:** Select `GET`, `POST`, `PUT`, `DELETE`, and `OPTIONS`.
3. Click **Save**.

---

### Step 39: Execute Integration Validation Checks

#### 1. Retrieve the Live Deployment String
Go to the **Stages** panel, click into your `$default` stage environment configuration, and copy the auto-generated **Invoke URL** (e.g., `https://xxxxxxxxxx.execute-api.<your-region>.amazonaws.com`).

#### 2. Verify Public Catalog Access
Run a standard curl request from your local machine terminal against the product catalog route. It should complete instantly without token processing:
```bash
curl https://xxxxxxxxxx.execute-api.<your-region>.amazonaws.com/products
```

#### 3. Confirm Route Security Enforcement
Test the rest of your transactional endpoints. Because they are bound to the `ANY /{proxy+}` path, they should actively reject raw traffic:
```bash
curl https://xxxxxxxxxx.execute-api.<your-region>.amazonaws.com/cart
curl https://xxxxxxxxxx.execute-api.<your-region>.amazonaws.com/users
curl https://xxxxxxxxxx.execute-api.<your-region>.amazonaws.com/orders
```
* **Expected System Output:** `{"message":"Unauthorized"}` (HTTP Status `401`). This confirms your Cognito JWT authorizer is working as intended.

### Step 40: API Gateway Troubleshooting Matrix
If your public API traffic encounters routing errors or drops, trace the symptoms using this baseline failure matrix:

#### 1. CORS Failuers:
* **Verify Header Flags:** Ensure your API Gateway CORS setup includes `Access-Control-Allow-Headers: *` explicitly.
* **Audit Preflight Targets:** Double-check that your `OPTIONS /{proxy+}` routing target exists and uses the shared, open internal ALB integration without authentication profiles attached.

#### 2. Auth Rejections (`401 Unauthorized`)
* **Match Issuer Keys:** Confirm that your authorizer's regional Cognito User Pool ID URI string doesn't contain typos or wrong regions.
* **Match Target Audiences:** Ensure the API Gateway authorizer audience parameter string matches your application's client registration ID.

#### 3. Integration Routing Failures (`502 Bad Gateway`)
* **Check Transport Pipelines:** Open the **API Gateway Console** $\rightarrow$ **VPC Links** and confirm that the connectivity state reads `Available`.
* **Trace Backend Points:** Confirm your private integration targets the correct internal ALB DNS endpoint name over port `80`.
* **Audit Core Health Probes:** Confirm that target groups under the load balancer show at least 1 healthy computational node container running.

#### 4. Upstream Dropped Packets (`504 Gateway Timeout`)
* **Verify Compute States:** Open the ECS cluster console and confirm that tasks are not crashing or looping during execution.
* **Audit Network Access Group Boundaries:** 
  * The `web-app-vpclink-sg` security group must explicitly accept inbound HTTP/HTTPS traffic from `0.0.0.0/0`.
  * The internal `web-ALB-SG` load balancer security group must explicitly accept inbound HTTP traffic originating from your full VPC CIDR range (`10.10.0.0/16`).

---

### Step 41: Final Frontend-Backend Stack Integration
With a validated, live gateway routing traffic up to your compute stack, patch your frontend build parameters to point directly to the public API link.

#### 1. Update the Frontend Network Configuration
1. Open your terminal and jump into your project root folder repository:
   ```bash
   cd frontend/react-app
   ```
2. Open `src/aws-config.js` and paste your secure API execution root into the empty `baseUrl` parameter string:
   ```javascript
   const awsConfig = {
     Auth: {
       Cognito: {
         userPoolId: '<COGNITO_USER_POOL_ID>',       // Already configured in Step 14
         userPoolClientId: '<COGNITO_CLIENT_ID>',    // Already configured in Step 14
         loginWith: {
           email: true,
         },
       }
     },
     API: {
       baseUrl: '<API_GATEWAY_URL>'  // e.g., https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
     }
   };
   
   export default awsConfig;
   ```

#### 2. Compile and Sync the Assets
1. Compile your application production bundle and clear out outdated remote distribution tracking variables:
   ```bash
   npm run build
   aws s3 sync build/ s3://<your-frontend-bucket-name> --delete --exclude "images/*"
   ```

#### 3. Clear the Edge Cache Layer (CloudFront Invalidation)
Because CloudFront securely mirrors your content across worldwide points of presence, edge systems will serve old configurations until the cache expires or is forced to clear.
1. Open the **CloudFront Console**, select your project's distribution, and switch over to the **Invalidations** tab.
2. Click **Create invalidation**.
3. Type `/*` into the object paths text input box and click **Create invalidation**.
> ⏱️ **Note:** The purge process typically routes across global servers and completes in under 1 minute. Once finished, load your CloudFront URL in your browser to verify a fully functioning deployment.

### Step 42: End-to-End Application Testing
1. Launch your browser and navigate to your production endpoint: `https://<your-cloudfront-domain>`
2. Walk through the complete user funnel to confirm that every microservice layer is fully unified:
   * Register a test user account and complete the email verification loop.
   * Log in, browse the product catalog grid, and review individual product details.
   * Add items to your shopping cart, progress to checkout, and place a mock order.
   * Open your account dashboard to ensure your purchase history updates successfully.

---

### Step 43: Deploy Event-Driven Notification Layers (SNS & SQS)
Implement a decoupled, event-driven messaging layer to broadcast transaction updates. When an order is completed, Amazon SNS fanouts notifications to a vendor processing queue and directly fires a confirmation email to system administrators.

> ℹ️ **Design Note:** In a standard production layout, transactional emails should route through **Amazon SES (Simple Email Service)** via an AWS Lambda subscription. However, because new AWS accounts place Amazon SES inside a restrictive Sandbox environment by default—which requires a formal AWS support case and a multi-day review to lift—we will bypass this hurdle for our development run by sending messages directly to a fixed email address using native **Amazon SNS** capabilities.

#### 1. Provision the SNS Pub/Sub Topic
1. Open the **Amazon SNS Console**, click **Topics** on the left menu panel, and click **Create topic**.
2. Configure the core structural settings:
   * **Type:** Select `Standard`
   * **Name:** `web-app-order-events`
   * **Display name:** `Web App Order Events`
3. Click **Create topic**.
4. Copy the unique **Topic ARN** from the details dashboard (e.g., `arn:aws:sns:<your-region>:<your-account-id>:web-app-order-events`) and save it to your notepad.

#### 2. Provision the SQS Vendor Processing Queue
1. Navigate to the **Amazon SQS Console**, click **Queues** on the left menu panel, and click **Create queue**.
2. Configure the messaging line settings:
   * **Type:** Select `Standard`
   * **Name:** `web-app-order-shipping`
3. Click **Create queue**.
4. Copy the **Queue ARN** string from the configuration page summaries block.

---

### Step 44: Link Messaging Subscriptions

#### 1. Attach the Administrative Email Pipeline
1. Return to your `web-app-order-events` topic dashboard, find the **Subscriptions** tab, and click **Create subscription**.
2. Complete the communication parameters:
   * **Protocol:** Select `Email`
   * **Endpoint:** Provide your personal email account address (e.g., `admin@yourdomain.com`)
3. Click **Create subscription**.
4. ⚠️ **Action Required:** Open your email client inbox, find the validation message from AWS Notifications, and click the **Confirm subscription** link. Verify that the subscription status updates to **Confirmed** inside the SNS management console.

#### 2. Attach the SQS Fulfillment Pipeline
1. Click **Create subscription** inside your SNS topic panel again to hook up your shipping infrastructure:
   * **Protocol:** Select `Amazon SQS`
   * **Endpoint:** Choose or paste your target `web-app-order-shipping` Queue ARN
2. Click **Create subscription**.
3. *Verification Step:* This direct mapping automatically patches the SQS Queue Access Policy with the explicit `SQS:SendMessage` condition rules required for SNS to push events into it. You can check this by reviewing the **Access policy** JSON block under your SQS settings.

---

### Step 45: Publish Variables and Cycle Backend Compute

#### 1. Register the Topic Endpoint
1. Open the **Systems Manager Console**, select **Parameter Store**, and click **Create parameter**.
2. Register the routing location so the order microservice can locate the notification channel:
   * **Name:** `/ecommerce/dev/sns/topic-arn`
   * **Type:** `String`
   * **Value:** Paste your copied `arn:aws:sns:<your-region>:<your-account-id>:web-app-order-events` payload
3. Click **Create parameter**.

#### 2. Perform an In-Place Service Refresh
Because the order container instances only query the Parameter Store during their boot sequence, you must force a cluster update to inject the new SNS credentials:
1. Navigate to the **Amazon ECS Console**, choose your cluster, and select the `web-app-order-service` item block.
2. Click **Update service** (or **Deploy** dropdown options) and check the **Force new deployment** checkbox toggle.
3. Click **Update** and wait until the cluster provisions a new healthy task container while cleanly draining old execution instances.

---

### Step 46: Verify the Event-Driven Workflow
1. Load your live storefront app via your CloudFront URL and purchase an item.
2. **Validate Email Routing:** Check your email inbox. You should receive a raw text message containing your order transaction payload directly from AWS Notifications.
3. **Validate Queue Operations:**
   * Open the **SQS Console** and click into your `ecommerce-order-shipping` queue.
   * Click **Send and receive messages** from the top right actions block.
   * Scroll down to the messages section and click **Poll for messages**.
   * Open the pulled payload packet to confirm that the order event details perfectly mirrored down into your vendor processing layer.

### Step 47: Configure Custom Domain & SSL (HTTPS)
Migrate your application from the default AWS development URLs to a branded custom domain name secured with an SSL/TLS certificate.

#### Prerequisites
* A registered public domain name (purchased through Amazon Route 53 or an external registrar like GoDaddy or Namecheap).
* Amazon Route 53 set up as the primary DNS management service for your domain.

---

### Step 48: Establish the Route 53 Public Hosted Zone
If you have not already linked your domain to Route 53, create a hosted zone to manage your public DNS entries:
1. Navigate to the **Route 53 Console**, click **Hosted zones** in the left menu, and select **Create hosted zone**.
2. Provide your core domain properties:
   * **Domain name:** `yourdomain.com`
   * **Type:** `Public hosted zone`
3. Click **Create hosted zone**.
4. Locate the auto-generated **NS (Name Server)** record block containing four distinct server addresses.
5. ⚠️ **Critical Action:** Copy these four addresses and update the custom name server fields at your third-party domain registrar to route your internet traffic through AWS.

---

### Step 49: Provision an SSL/TLS Certificate (AWS Certificate Manager)

#### 1. Request the Certificate
1. Open the **AWS Certificate Manager (ACM) Console**.
2. ⚠️ **Important Region Requirement:** You must switch your active AWS region console dropdown to **us-east-1 (N. Virginia)**. CloudFront can only attach certificates that are stored in the `us-east-1` region.
3. Click **Request certificate** and choose **Request a public certificate**.
4. Add the explicit domain pathways you intend to secure:
   * `yourdomain.com`
   * `www.yourdomain.com`
   * `*.yourdomain.com` *(Optional: include this wildcard format if you plan to support custom staging or testing subdomains later)*
5. Set the **Validation method** to **DNS validation** and click **Request**.

#### 2. Validate Domain Ownership
1. From your ACM dashboard, click on the **Certificate ID** you just generated.
2. Inside the validation status block, click the **Create records in Route 53** button.
3. Review the structural configurations and click **Create records**. This automatically injects the required verification CNAME values directly into your hosted zone.
4. Wait roughly 1 to 2 minutes for network synchronization. The status badge will update from Pending to a green **Issued** state.

---

### Step 50: Link the Custom Domain to CloudFront
1. Navigate to the **CloudFront Console**, click on your project's active distribution, and select **Edit** from the **General** settings panel.
2. Adjust the baseline server properties:
   * **Alternate domain names (CNAMEs):** Click add item and type `yourdomain.com`, then click add item again and type `www.yourdomain.com`.
   * **Custom SSL certificate:** Click the dropdown selection box and choose your newly issued ACM certificate.
3. Scroll to the bottom and click **Save changes**. 
> ⏳ **Note:** CloudFront takes roughly 5 to 10 minutes to safely provision your encryption keys across all global edge locations.

---

### Step 51: Map the Public Route 53 DNS Records
Map your top-level domain and its subdomains directly to your globally distributed CloudFront network infrastructure.

#### 1. Configure the Root Domain Mapping (Apex Record)
1. Go back to the **Route 53 Console** and click into your domain's active hosted zone.
2. Click **Create record** and apply the following settings:
   * **Record name:** Leave this completely blank *(this targets the absolute root domain `yourdomain.com`)*
   * **Record type:** `A - Routes traffic to an IPv4 address and some AWS resources`
   * **Alias:** Toggle this switch box **On**
   * **Route traffic to:** Select **Alias to CloudFront distribution**
   * **Choose distribution:** Select your active project CloudFront configuration from the list.
   * **Routing policy:** Choose `Simple routing`
3. Click **Create records**.

#### 2. Configure the World Wide Web Mapping (WWW Record)
1. Click **Create record** a second time to configure the sub-routing pathway:
   * **Record name:** Enter `www`
   * **Record type:** `A`
   * **Alias:** Toggle this switch box **On**
   * **Route traffic to:** Select **Alias to CloudFront distribution**
   * **Choose distribution:** Select your same active CloudFront distribution.
2. Click **Create records**.

---

### Step 52: Update Cognito Authentication Callback Targets
Because your browser application redirects users back to the frontend after they complete sign-in steps, you must update Cognito's legal endpoint whitelist with your new secure addresses.

1. Open the **Cognito Console**, click **User pools**, and select your project's pool.
2. Expand the **App integration** tab, scroll to **App clients**, and choose **Edit** on your client instance.
3. Locate the **Hosted UI settings** block and update your routing locations:
   * **Allowed callback URLs:** Append `https://yourdomain.com` and `https://www.yourdomain.com` to the listing.
   * **Allowed sign-out URLs:** Append `https://yourdomain.com` and `https://www.yourdomain.com` to the listing.
4. Click **Save changes**.

---

### Step 53: Production-Ready Verification Testing
1. Launch an absolute clean browser session (or private browsing tab) and navigate to your production URL: `https://yourdomain.com`
2. Look at the address URL bar to verify that the **padlock icon** shows as secure and valid, showing that your custom SSL certificate is working correctly.
3. Test your full application lifecycle features end-to-end:
   * Confirm product item blocks pull smoothly without error (validating public API Gateway routing).
   * Register or log in to a profile account (validating public domain Cognito handshakes).
   * Modify your cart, initiate checkout, complete an order, and verify that your confirmation emails and fulfillment vendor SQS messages trigger successfully.

🎉 **Congratulations!** You have successfully deployed a production-ready, highly available, secure, microservice-based e-commerce platform across an automated AWS Fargate serverless ecosystem.


