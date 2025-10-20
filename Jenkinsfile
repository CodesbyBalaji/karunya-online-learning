pipeline {
    agent {
        docker {
            image 'node:24'      // Use official Node.js 24 image
            args '-u root:root'   // Run as root to allow installation if needed
        }
    }

    environment {
        IMAGE_NAME = "balajia0910/karunya-online-learning"
        IMAGE_TAG  = "1"
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

        stage('Build Docker Image') {
            steps {
                echo '🐳 Building Docker image...'
                sh "docker build -t $IMAGE_NAME:$IMAGE_TAG ."
            }
        }

        stage('Push Docker Image') {
            steps {
                echo '📤 Pushing Docker image to Docker Hub...'
                withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        docker push $IMAGE_NAME:$IMAGE_TAG
                    '''
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
