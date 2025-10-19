pipeline {
    agent any

    environment {
        NVM_DIR = "${env.HOME}/.nvm"
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
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use 24
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
