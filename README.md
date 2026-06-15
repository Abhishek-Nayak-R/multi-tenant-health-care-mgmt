# AuraHealth: Multi-Tenant Healthcare Management System

AuraHealth is a modern, enterprise-grade **Electronic Health Record (EHR) & Healthcare Management System** built with a secure cloud-native microservices architecture. It demonstrates production-level Java full-stack capabilities, targeting advanced topics like dynamic schema-based multi-tenancy, CQRS search offloading with Elasticsearch, Kubernetes deployment topologies, and modular frontend architectures.

---

## 🚀 Key Architectural Features

1.  **Dynamic Schema-based Multi-Tenancy**: Resolves the client database schema dynamically on every incoming request. Uses PostgreSQL schema separation (`tenant_a`, `tenant_b`) to meet strict HIPAA isolation requirements.
2.  **Fuzzy Search CQRS Index (Elasticsearch)**: Offloads heavy query loads from transactional database tables. Database inserts trigger event-driven indexing requests to an Elasticsearch cluster.
3.  **Role-Based Access Control (RBAC)**: Implements stateless JWT authentication containing role permissions (`ROLE_DOCTOR`, `ROLE_ADMIN`) and tenant claims.
4.  **Modern Angular Client**: Structured using Angular 22+ with standalone components, Signals for reactive state management, and functional interceptors for context propagation.
5.  **Kubernetes & OCP Ready**: Complete with multi-stage Dockerfiles, a local docker-compose configuration, and Kubernetes manifests (Deployments, Services, ConfigMaps, Secrets, Ingress) designed for GKE or Red Hat OpenShift.

---

## 📁 Repository Structure

```text
multi-tenant-health-care-mgmt/
├── backend/                            # Spring Boot Microservices (Java 17)
│   ├── auth-service/                   # Generates and validates JWTs carrying tenant context
│   ├── patient-service/                # Dynamic PostgreSQL schema-routing CRUD database layer
│   └── search-service/                 # Elasticsearch client querying index filtered by tenant
├── frontend/                           # Angular 22 standalone application
│   ├── src/app/
│   │   ├── auth.service.ts             # Tracks logged-in context via signals
│   │   ├── tenant.interceptor.ts       # Injects Bearer token and X-TenantID header
│   │   ├── login.ts                    # Tenant selection and login form component
│   │   └── dashboard.ts                # Doctor dashboard and real-time Elasticsearch search
│   └── Dockerfile                      # Nginx-based multi-stage web container build
└── devops/                             # Containers and Deployment Configurations
    ├── docker-compose.yml              # Local composition for databases and microservices
    ├── postgres-init/
    │   └── init.sql                    # Initial SQL setup creating tenant schemas and mock data
    └── k8s/                            # Production Kubernetes GKE manifests
```

---

## 🛠️ Developer Setup & Quick Start

### Prerequisites
*   **Docker Desktop** (or Colima) installed and running.
*   *Alternatively (for local running)*: JDK 17, Node.js 20+, running PostgreSQL, and Elasticsearch.

### Option A: Run in Docker (Recommended)
You can launch the entire cluster with a single command:
```bash
cd devops
docker-compose up --build
```
Once the containers are healthy, open your browser and navigate to: **`http://localhost`** to view the AuraHealth UI.

### Option B: Run Services Locally
If you prefer running the applications on your host machine:

1.  **Database Configuration**:
    *   Ensure PostgreSQL is running on port `5432` with a database named `hms_db`.
    *   Execute the SQL statements inside `devops/postgres-init/init.sql` to generate schemas and mock patient data.
    *   Ensure Elasticsearch is running on port `9200`.

2.  **Launch Auth Service**:
    ```bash
    cd backend/auth-service
    ./mvnw spring-boot:run
    ```

3.  **Launch Patient Service**:
    ```bash
    cd backend/patient-service
    ./mvnw spring-boot:run
    ```

4.  **Launch Search Service**:
    ```bash
    cd backend/search-service
    ./mvnw spring-boot:run
    ```

5.  **Launch Angular UI**:
    ```bash
    cd frontend
    npm install
    npm run start
    ```
    Open **`http://localhost:4200`** in your browser.

---

## 🔑 Test Credentials & Demo Guide

The system is seeded with mock doctor credentials belonging to different clinical workspaces:

| Username | Password | Tenant / Workspace | Allowed Role | Visibility scope |
| :--- | :--- | :--- | :--- | :--- |
| **`doctor_alpha`** | `password` | **`tenant_a`** (Alpha Clinic) | `ROLE_DOCTOR` | Read-only access to Alpha Clinic patients. |
| **`doctor_beta`** | `password` | **`tenant_b`** (Beta Hospital) | `ROLE_DOCTOR` | Read-only access to Beta Hospital patients. |
| **`admin`** | `password` | **`tenant_a`** (Alpha Clinic) | `ROLE_ADMIN` | Read/write access. Can register new patients to Alpha Clinic database. |

### Verification Steps:
1.  **Auth Isolation**: Log in as `doctor_alpha` selecting *Alpha Clinic*. You will see patients John Doe and Alice Smith. Logout and login as `doctor_beta` selecting *Beta Hospital*. You will see Robert Johnson and Emma Watson. Notice that database tables are strictly partitioned.
2.  **Fuzzy Search**: In the Elasticsearch panel, search for `john`. The index will dynamically query the database and search index for `John Doe` if you are on Tenant A. Try searching for `Robert` while on Tenant B.
3.  **Role-Based Security**: Notice that when logged in as `doctor_alpha` (`ROLE_DOCTOR`), the *Register Patient* action is hidden. Log in as `admin` (`ROLE_ADMIN`) to access the patient creation modal, which triggers the Postgres write and updates the Elasticsearch index instantly.
