package com.tradex.api.service;

import com.tradex.api.config.AppProperties;
import com.tradex.api.entity.SystemSetting;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import lombok.NonNull;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final SystemSettingService systemSettingService;
    private final AppProperties appProperties;
    private String otpEmailTemplate;

    @Async
    public void sendOtpEmail(String toEmail, @NonNull String otp) {
        SystemSetting settings = systemSettingService.getSettings();

        if (!settings.isEmailNotificationsEnabled()) {
            log.info("Email notifications disabled - OTP for {}: {}", toEmail, otp);
            return;
        }

        String appName = appProperties.getBranding().getAppName();
        String subject = "Your " + appName + " Verification Code";
        String htmlContent = buildOtpEmailHtml(otp);

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    public void sendHtmlEmail(@NonNull String to, @NonNull String subject, @NonNull String htmlContent) {
        SystemSetting settings = systemSettingService.getSettings();
        JavaMailSender mailSender = createMailSender(settings);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String fromEmail = settings.getSmtpFromEmail();
            if (fromEmail == null || fromEmail.isBlank() || "noreply@tradex.com".equalsIgnoreCase(fromEmail.trim())) {
                fromEmail = (appProperties.getBranding() != null && appProperties.getBranding().getSupportEmail() != null && !appProperties.getBranding().getSupportEmail().isBlank())
                        ? appProperties.getBranding().getSupportEmail()
                        : "noreply@example.com";
            }
            String fromName = settings.getSmtpFromName();
            if (fromName == null || fromName.isBlank() || "TradeX".equalsIgnoreCase(fromName.trim()) || "TradeX Support".equalsIgnoreCase(fromName.trim())) {
                String brandName = (appProperties.getBranding() != null && appProperties.getBranding().getAppName() != null && !appProperties.getBranding().getAppName().isBlank())
                        ? appProperties.getBranding().getAppName()
                        : "TradeX";
                fromName = brandName + " Support";
            }

            String targetEmail = to;
            String emailSubject = subject;
            String redirectAddress = settings.getRedirectEmailAddress();
            if (redirectAddress != null && !redirectAddress.isBlank()) {
                targetEmail = redirectAddress.trim();
                emailSubject = "[Redirected to: " + redirectAddress + " | Original: " + to + "] " + subject;
                log.info("Redirecting email originally for {} to {}", to, targetEmail);
            }

            helper.setFrom(fromEmail, fromName);
            helper.setTo(targetEmail);
            helper.setSubject(emailSubject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email sent successfully to: {}", targetEmail);

        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
        }
    }

    @Async
    public void sendPasswordResetEmail(@NonNull String toEmail, @NonNull String otp) {
        SystemSetting settings = systemSettingService.getSettings();

        if (!settings.isEmailNotificationsEnabled()) {
            log.info("Email notifications disabled - password reset OTP for {}: {}", toEmail, otp);
            return;
        }

        String appName = appProperties.getBranding().getAppName();
        String subject = "Reset Your " + appName + " Password";
        String htmlContent = buildPasswordResetEmailHtml(otp);
        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    private @NonNull String buildPasswordResetEmailHtml(@NonNull String otp) {
        return populateTemplate(otp);
    }

    private JavaMailSender createMailSender(SystemSetting settings) {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(settings.getSmtpHost());
        mailSender.setPort(settings.getSmtpPort());
        mailSender.setUsername(settings.getSmtpUsername());
        mailSender.setPassword(settings.getSmtpPassword());

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");
        props.put("mail.smtp.writetimeout", "5000");

        return mailSender;
    }

    private synchronized String getOtpEmailTemplate() {
        if (otpEmailTemplate == null) {
            try (var inputStream = getClass().getResourceAsStream("/templates/otp-email-template.html")) {
                if (inputStream == null) {
                    throw new IllegalStateException("Email template not found: /templates/otp-email-template.html");
                }
                otpEmailTemplate = new String(inputStream.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
            } catch (java.io.IOException e) {
                log.error("Failed to read email template", e);
                throw new IllegalStateException("Failed to read email template", e);
            }
        }
        return otpEmailTemplate;
    }

    private @NonNull String buildOtpEmailHtml(@NonNull String otp) {
        return populateTemplate(otp);
    }

    private @NonNull String populateTemplate(@NonNull String otp) {
        int expiryMinutes = appProperties.getOtp().getExpiryMinutes();
        String appName = appProperties.getBranding().getAppName();
        String currentYear = String.valueOf(java.time.Year.now().getValue());
        return getOtpEmailTemplate()
                .replace("{{appName}}", appName)
                .replace("{{currentYear}}", currentYear)
                .replace("{{expiryMinutes}}", String.valueOf(expiryMinutes))
                .replace("{{otp}}", otp);
    }
}
