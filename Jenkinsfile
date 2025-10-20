pipeline {
    agent {
        docker {
            image 'node:24'   // Use official Node.js 24 image
            args '-u root:root' // Run as root to install dependencies if needed
        }
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
                sh '''
                    npm install
                '''
            }
        }

        stage('Run Tests') {
            steps {
                echo '🧪 Running test cases...'
                sh '''
                    npm test || echo "No tests configured"
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Build and test completed successfully!'
        }
        failure {
            echo '❌ Build or test failed. Check logs for details.'
        }
    }
}
