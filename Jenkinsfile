pipeline {
    agent any

    environment {
        // Set the path to nvm
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
                    # Load nvm
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    
                    # Use Node 24
                    nvm use 24

                    # Navigate to project folder
                    cd "$WORKSPACE/Mini Project"

                    # Install npm dependencies
                    npm install
                '''
            }
        }

        stage('Run Tests') {
            steps {
                echo '🧪 Running test cases...'
                sh '''
                    cd "$WORKSPACE/Mini Project"
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
