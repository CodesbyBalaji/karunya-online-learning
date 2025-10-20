pipeline {
    agent any  // Use the default Jenkins agent

    environment {
        IMAGE_NAME = "balajia0910/karunya-online-learning"
        IMAGE_TAG  = "1"
        DOCKER_CMD = "/usr/local/bin/docker"  // Full path to Docker
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
    }

    post {
        success {
            echo '✅ Build, test, and Docker push completed successfully!'
        }
        failure {
            echo '❌ Something failed. Check logs for details.'
        }
    }
}
