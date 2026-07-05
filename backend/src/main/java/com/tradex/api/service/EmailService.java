package com.tradex.api.service;

import com.tradex.api.config.AppProperties;
import com.tradex.api.entity.SystemSetting;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.lang.NonNull;
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
    public void sendOtpEmail(@NonNull String toEmail, @NonNull String otp) {
        SystemSetting settings = systemSettingService.getSettings();

        if (!settings.isEmailNotificationsEnabled()) {
            log.info("Email notifications disabled - OTP for {}: {}", toEmail, otp);
            return;
        }

        String subject = "Your TradeX Verification Code";
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
            if (fromEmail == null) {
                fromEmail = "noreply@tradex.com";
            }
            String fromName = settings.getSmtpFromName();
            if (fromName == null) {
                fromName = "TradeX";
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

        String subject = "Reset Your TradeX Password";
        String htmlContent = buildPasswordResetEmailHtml(otp);
        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    private @NonNull String buildPasswordResetEmailHtml(@NonNull String otp) {
        int expiryMinutes = appProperties.getOtp().getExpiryMinutes();
        // Reuse the OTP template — same structure, different subject line
        return getOtpEmailTemplate()
                .replace("{{expiryMinutes}}", String.valueOf(expiryMinutes))
                .replace("{{otp}}", otp);
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
                throw new RuntimeException(e);
            }
        }
        return otpEmailTemplate;
    }

    private @NonNull String buildOtpEmailHtml(@NonNull String otp) {
        int expiryMinutes = appProperties.getOtp().getExpiryMinutes();
        return getOtpEmailTemplate()
                .replace("{{expiryMinutes}}", String.valueOf(expiryMinutes))
                .replace("{{otp}}", otp);
    }
}
