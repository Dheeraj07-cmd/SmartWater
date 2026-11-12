package com.codecrew.smartwater.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${brevo.api.key:}")
    private String apiKey;

    @Value("${brevo.sender.email:admin@smartwater.local}")
    private String senderEmail;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public EmailService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void sendAlertEmail(String toEmail, String residentName, String subject, String messageContent) {
        if (apiKey == null || apiKey.isBlank() || toEmail == null || toEmail.isBlank()) {
            logger.warn("Brevo API key or recipient email is not configured. Skipping email to {}", toEmail);
            return;
        }

        String safeName = (residentName != null && !residentName.isBlank()) ? residentName : "Resident";
        String safeMessage = (messageContent != null) ? messageContent : "";

        try {
            String htmlTemplate = """
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
                    <div style='background-color: #e74c3c; color: white; padding: 20px; text-align: center;'>
                        <h2 style='margin: 0;'>⚠️ SmartWater Alert</h2>
                    </div>
                    <div style='padding: 30px; background-color: #f9f9f9; color: #333;'>
                        <h3 style='margin-top: 0;'>Hello %s,</h3>
                        <p style='font-size: 16px; line-height: 1.6;'>
                            Our monitoring system has detected an anomaly in your recent water consumption.
                        </p>
                        <div style='background-color: #fff; padding: 15px; border-left: 5px solid #e74c3c; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>
                            <strong>Alert Details:</strong><br/>
                            <span style='color: #c0392b; font-size: 15px;'>%s</span>
                        </div>
                        <div style='font-size: 14px; line-height: 1.5; color: #555;'>
                            <strong>Recommended Actions:</strong>
                            <ul style='font-size: 14px; color: #555;'>
                                <li>Check all indoor and outdoor taps to ensure they are fully closed.</li>
                                <li>Inspect your toilets for silent running leaks.</li>
                                <li>If you recently filled a pool or had guests, you can ignore this alert.</li>
                            </ul>
                        </div>
                        <div style='text-align: center; margin-top: 30px;'>
                            <a href='http://localhost:5173/dashboard' style='background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>View My Dashboard</a>
                        </div>
                    </div>
                    <div style='background-color: #2c3e50; color: #ecf0f1; text-align: center; padding: 15px; font-size: 12px;'>
                        This is an automated message from the SmartWater Platform.<br/>
                        Please do not reply to this email.
                    </div>
                </div>
                """;

            String formattedHtml = String.format(htmlTemplate, safeName, safeMessage);

            Map<String, Object> payloadMap = Map.of(
                    "sender", Map.of("name", "SmartWater Admin", "email", senderEmail),
                    "to", List.of(Map.of("email", toEmail, "name", safeName)),
                    "subject", subject != null ? subject : "SmartWater Usage Alert",
                    "htmlContent", formattedHtml
            );

            String jsonPayload = objectMapper.writeValueAsString(payloadMap);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/json")
                    .header("api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 201 || response.statusCode() == 200) {
                logger.info("Alert email successfully sent to {}", toEmail);
            } else {
                logger.error("Failed to send email. Brevo responded with: {}", response.body());
            }

        } catch (Exception e) {
            logger.error("Error occurred while sending email via Brevo: {}", e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String toEmail, String residentName, String resetUrl) {
        if (apiKey == null || apiKey.isBlank() || toEmail == null || toEmail.isBlank()) {
            logger.warn("Brevo API key is not configured. Skipping password reset email to {}", toEmail);
            return;
        }

        String safeName = (residentName != null && !residentName.isBlank()) ? residentName : "User";

        try {
            String subject = "SmartWater - Password Reset Request";

            String htmlTemplate = """
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
                    <div style='background-color: #3498db; color: white; padding: 20px; text-align: center;'>
                        <h2 style='margin: 0;'>Password Reset Request</h2>
                    </div>
                    <div style='padding: 30px; background-color: #f9f9f9; color: #333;'>
                        <h3 style='margin-top: 0;'>Hello %s,</h3>
                        <p style='font-size: 16px; line-height: 1.6;'>
                            We received a request to reset the password for your SmartWater account associated with this email address.
                        </p>
                        <p style='font-size: 16px; line-height: 1.6;'>
                            Click the button below to securely reset your password. This link will expire in 15 minutes.
                        </p>
                        <div style='text-align: center; margin: 35px 0;'>
                            <a href='%s' style='background-color: #3498db; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;'>Reset My Password</a>
                        </div>
                        <p style='font-size: 14px; line-height: 1.5; color: #7f8c8d;'>
                            If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                        </p>
                    </div>
                    <div style='background-color: #2c3e50; color: #ecf0f1; text-align: center; padding: 15px; font-size: 12px;'>
                        This is an automated message from the SmartWater Platform.<br/>
                        Please do not reply to this email.
                    </div>
                </div>
                """;

            String formattedHtml = String.format(htmlTemplate, safeName, resetUrl);

            Map<String, Object> payloadMap = Map.of(
                    "sender", Map.of("name", "SmartWater Support", "email", senderEmail),
                    "to", List.of(Map.of("email", toEmail, "name", safeName)),
                    "subject", subject,
                    "htmlContent", formattedHtml
            );

            String jsonPayload = objectMapper.writeValueAsString(payloadMap);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/json")
                    .header("api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 201 || response.statusCode() == 200) {
                logger.info("Password reset email successfully sent to {}", toEmail);
            } else {
                logger.error("Failed to send password reset email. Brevo responded with: {}", response.body());
            }

        } catch (Exception e) {
            logger.error("Error occurred while sending password reset email via Brevo: {}", e.getMessage());
        }
    }
}