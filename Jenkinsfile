pipeline {
    agent any
    
    environment {
        DOCKER_API_VERSION = '1.43'
        
        // --- CẤU HÌNH ---
        GIT_REPO_URL    = 'https://github.com/cnguyenmanh26/vietmythluminarts-api.git'
        GIT_BRANCH      = 'main'
        
        CONTAINER_NAME  = 'ezhome_backend'
        OLD_CONTAINER   = 'home-ezhome-backend'
        
        IMAGE_NAME      = 'ezhome-backend-image'
        NETWORK_NAME    = 'home_default'
        APP_PORT        = '5000'
        NGINX_CONTAINER = 'home-nginx-1'
        
        // ĐÂY LÀ ĐÍCH ĐẾN: Nơi file env sẽ được tạo ra trên server để Docker đọc
        // (Jenkins sẽ lấy nội dung bí mật ghi vào file này)
        TARGET_ENV_PATH = '/home/ezhome/back-end/.env'
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                git branch: "${GIT_BRANCH}", url: "${GIT_REPO_URL}"
            }
        }

        stage('2. Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${IMAGE_NAME}:latest ."
                }
            }
        }

        stage('3. Deploy (Dùng Credentials)') {
            steps {
                // --- ĐOẠN NÀY QUAN TRỌNG ---
                // Lấy file từ Jenkins Credentials có ID 'vietmyth-env-file'
                // Gán nó vào biến tạm tên là SECRET_FILE
                withCredentials([file(credentialsId: 'ezhome-env-file', variable: 'SECRET_FILE')]) {
                    script {
                        echo "--- 🔓 Đang lấy file .env từ Jenkins Credentials ---"
                        
                        // 1. Copy nội dung từ file bí mật của Jenkins -> File trên server
                        // (Lệnh này đảm bảo file trên server luôn khớp với Jenkins)
                        sh "cat \$SECRET_FILE > ${TARGET_ENV_PATH}"
                        
                        // 2. Dọn dẹp container cũ
                        sh "docker stop ${OLD_CONTAINER} || true"
                        sh "docker rm ${OLD_CONTAINER} || true"
                        sh "docker stop ${CONTAINER_NAME} || true"
                        sh "docker rm ${CONTAINER_NAME} || true"
                        
                        // 3. Chạy container mới (Trỏ vào file vừa được tạo ra)
                        sh """
                            docker run -d \
                            --name ${CONTAINER_NAME} \
                            --network ${NETWORK_NAME} \
                            --restart always \
                            --env-file ${TARGET_ENV_PATH} \
                            -e NODE_ENV=production \
                            --expose ${APP_PORT} \
                            ${IMAGE_NAME}:latest
                        """
                    }
                }
            }
        }

        stage('4. Refresh Nginx') {
            steps {
                script {
                    sh "docker exec ${NGINX_CONTAINER} nginx -s reload"
                }
            }
        }
    }
    
    post {
        always {
            sh "docker image prune -f" 
        }
    }
}