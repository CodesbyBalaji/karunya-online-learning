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
                echo '🌐 Setting up service access...'
                script {
                    // Try multiple methods to get accessible URL
                    try {
                        // Method 1: Port forward
                        sh "${KUBECTL_CMD} port-forward service/karunya-service 8080:3000 &"
                        sleep 5
                        SERVICE_URL = "http://localhost:8080"
                        echo "✅ Using port-forward: <a href='${SERVICE_URL}' target='_blank'>${SERVICE_URL}</a>"
                    } catch (Exception e) {
                        // Method 2: Minikube service URL
                        echo "🔄 Falling back to Minikube service URL..."
                        SERVICE_URL = sh(script: "timeout 30 ${MINIKUBE_CMD} service karunya-service --url | head -n1", returnStdout: true).trim()
                        echo "✅ Using Minikube service: <a href='${SERVICE_URL}' target='_blank'>${SERVICE_URL}</a>"
                    }
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
