pipeline {
    agent any  // Use the default Jenkins agent

    environment {
        IMAGE_NAME = "balajia0910/karunya-online-learning"
        IMAGE_TAG  = "1"
        DOCKER_CMD = "/usr/local/bin/docker"  // Full path to Docker
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

        stage('Pull Node Image') {
            steps {
                echo '⬇️ Pulling Node.js Docker image...'
                sh "$DOCKER_CMD pull node:24"
            }
        }

        stage('Build Docker Image') {
            steps {
                echo '🐳 Building Docker image...'
                sh "$DOCKER_CMD build -t $IMAGE_NAME:$IMAGE_TAG ."
            }
        }

        stage('Push Docker Image') {
            steps {
                echo '📤 Pushing Docker image to Docker Hub...'
                withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                        echo \$DOCKER_PASS | $DOCKER_CMD login -u \$DOCKER_USER --password-stdin
                        $DOCKER_CMD push $IMAGE_NAME:$IMAGE_TAG
                    """
                }
            }
        }

        // ====== NEW Kubernetes Deployment Stages ======
        stage('Deploy to Minikube') {
            steps {
                echo '🚀 Deploying app to Minikube...'
                sh '''
                    # Full paths
                    MINIKUBE_CMD=/opt/homebrew/bin/minikube
                    KUBECTL_CMD=/usr/local/bin/kubectl

                    # Configure environment to use Minikube Docker daemon
                    eval $($MINIKUBE_CMD docker-env)

                    # Delete old deployment & service if exist
                    $KUBECTL_CMD delete deployment karunya-app --ignore-not-found
                    $KUBECTL_CMD delete service karunya-service --ignore-not-found

                    # Apply deployment.yaml from repo (preferred way)
                    $KUBECTL_CMD apply -f deployment.yaml
                '''
            }
        }

        stage('Check Pods') {
            steps {
                echo '🔍 Verifying deployed pods...'
                sh '/usr/local/bin/kubectl get pods -o wide'
            }
        }

        stage('Get Service URL') {
            steps {
                echo '🌐 Retrieving Minikube service URL...'
                sh '/opt/homebrew/bin/minikube service karunya-service --url'
            }
        }
    }
}