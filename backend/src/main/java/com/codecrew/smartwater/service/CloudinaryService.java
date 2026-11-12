package com.codecrew.smartwater.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.codecrew.smartwater.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    // Uploads a MultipartFile image to Cloudinary and returns its HTTPS URL.
    public String uploadImage(MultipartFile file, String folderName) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("Uploaded image file cannot be empty", HttpStatus.BAD_REQUEST);
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> options = ObjectUtils.asMap(
                    "folder", folderName,
                    "resource_type", "image"
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);

            // Prefer 'secure_url' (HTTPS) over 'url' (HTTP)
            Object secureUrl = uploadResult.get("secure_url");
            return secureUrl != null ? secureUrl.toString() : uploadResult.get("url").toString();

        } catch (IOException e) {
            throw new ApiException("Failed to upload image to Cloudinary: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}