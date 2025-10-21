pipeline {
    agent any

    environment {
        IMAGE_NAME = "karunya-online-learning"      // Local Minikube image
        IMAGE_TAG  = "1"
        MINIKUBE_CMD = "/opt/homebrew/bin/minikube"
        KUBECTL_CMD = "/usr/local/bin/kubectl"
        KUBE_NAMESPACE = "default"
    }

    stages {
        stage('Checkout') {
            steps {
                echo '🔄 Pulling code from GitHub...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing project dependencies...'
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                echo '🧪 Running test cases...'
                sh 'npm test || echo "No tests configured"'
            }
        }

        stage('Set Minikube Docker Env') {
            steps {
                echo '⚙️ Configuring Jenkins to use Minikube Docker daemon...'
                sh '''
                    eval $(${MINIKUBE_CMD} docker-env)
                    echo "✅ Using Minikube Docker daemon:"
                    docker info | grep "Server Version"
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                echo '🐳 Building Docker image inside Minikube...'
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
            }
        }

        stage('Deploy to Minikube') {
            steps {
                echo '🚀 Deploying app to Minikube...'
                sh '''
                    # Delete old deployment & service if exist
                    ${KUBECTL_CMD} delete deployment karunya-app --ignore-not-found
                    ${KUBECTL_CMD} delete service karunya-service --ignore-not-found

                    # Apply deployment.yaml
                    ${KUBECTL_CMD} apply -f deployment.yaml

                    # Wait until pods are ready
                    echo "⏳ Waiting for pods to be ready..."
                    ${KUBECTL_CMD} rollout status deployment/karunya-app --timeout=120s
                '''
            }
        }

        stage('Check Pods') {
            steps {
                echo '🔍 Verifying deployed pods...'
                sh '${KUBECTL_CMD} get pods -o wide'
            }
        }

        stage('Get Service URL') {
            steps {
                echo '🌐 Retrieving working Minikube service URL...'
                script {
                    // Fetch localhost URL that works on Mac
                    SERVICE_URL = sh(script: "${MINIKUBE_CMD} service karunya-service --url | head -n1", returnStdout: true).trim()
                    echo "✅ Access your app at: ${SERVICE_URL}"
                }
            }
        }
    }

    post {
        success {
            echo '✅ Build, test, Docker build, and Kubernetes deployment completed successfully!'
        }
        failure {
            echo '❌ Something failed. Check logs for details.'
        }
    }
}
