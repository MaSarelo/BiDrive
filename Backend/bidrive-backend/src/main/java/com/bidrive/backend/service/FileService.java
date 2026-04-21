package com.bidrive.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileService {

    public String uploadFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Файл пустой!");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String newFilename = UUID.randomUUID() + extension;

        if (!isImage(extension)) {
            throw new RuntimeException("Разрешены только изображения (jpg, png, jpeg)!");
        }

        try {
            String UPLOAD_DIR = "uploads/";
            Path path = Paths.get(UPLOAD_DIR + newFilename);
            Files.copy(file.getInputStream(), path);
            return "/uploads/" + newFilename;
        } catch (IOException e) {
            throw new RuntimeException("Не удалось сохранить файл", e);
        }
    }

    private boolean isImage(String extension) {
        return extension.equals(".jpg") ||
                extension.equals(".jpeg") ||
                extension.equals(".png") ||
                extension.equals(".webp");
    }
}