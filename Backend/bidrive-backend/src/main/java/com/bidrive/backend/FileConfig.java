package com.bidrive.backend;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class FileConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Получаем абсолютный путь к папке проекта
        String uploadPath = System.getProperty("user.dir") + "/uploads/";

                registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath);
    }
}