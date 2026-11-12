package com.codecrew.smartwater.dto.request;
import lombok.Data;

@Data
public class UserProfileUpdateRequest {
    private String phoneNumber;
    private String profilePhotoBase64;
}