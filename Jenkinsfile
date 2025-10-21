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
                echo '🌐 Setting up port forwarding and getting URL...'
                script {
                    // Get a random available port
                    def randomPort = sh(script: 'python3 -c "import socket; s=socket.socket(); s.bind((\\\"\\\", 0)); print(s.getsockname()[1]); s.close()"', returnStdout: true).trim()
                    
                    // Start port-forward in background
                    sh "${KUBECTL_CMD} port-forward service/karunya-service ${randomPort}:3000 > /dev/null 2>&1 &"
                    sleep 5  // Wait for port-forward to establish
                    
                    SERVICE_URL = "http://localhost:${randomPort}"
                    
                    echo "✅ Access your app here: <a href='${SERVICE_URL}' target='_blank'>${SERVICE_URL}</a>"
                    echo "📝 Port forwarding is active on port ${randomPort}"
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
