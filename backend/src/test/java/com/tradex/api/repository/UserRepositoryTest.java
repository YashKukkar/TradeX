package com.tradex.api.repository;

import com.tradex.api.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void testSaveAndFindByEmail() {
        User user = new User("testdb@example.com", "hashedpass123");
        userRepository.save(user);

        Optional<User> foundUser = userRepository.findByEmail("testdb@example.com");

        assertTrue(foundUser.isPresent());
        assertEquals("testdb@example.com", foundUser.get().getEmail());
    }

    @Test
    void testExistsByEmail() {
        User user = new User("exists@example.com", "pass");
        userRepository.save(user);

        assertTrue(userRepository.existsByEmail("exists@example.com"));
        assertFalse(userRepository.existsByEmail("doesnotexist@example.com"));
    }

    @Test
    void testFindByReferralPathStartingWith() {
        User u1 = new User("u1@example.com", "pass");
        u1 = userRepository.save(u1);
        u1.setReferralPath("." + u1.getId() + ".");
        u1 = userRepository.save(u1);

        User u2 = new User("u2@example.com", "pass");
        u2.setReferredBy(u1);
        u2 = userRepository.save(u2);
        u2.setReferralPath(u1.getReferralPath() + u2.getId() + ".");
        u2 = userRepository.save(u2);

        User u3 = new User("u3@example.com", "pass");
        u3.setReferredBy(u2);
        u3 = userRepository.save(u3);
        u3.setReferralPath(u2.getReferralPath() + u3.getId() + ".");
        u3 = userRepository.save(u3);

        // Find by referral path starting with u2's path
        List<User> downlineOfU2 = userRepository.findByReferralPathStartingWith(u2.getReferralPath());
        assertEquals(2, downlineOfU2.size());

        boolean foundU2 = false;
        boolean foundU3 = false;
        for (User u : downlineOfU2) {
            if (u.getEmail().equals("u2@example.com"))
                foundU2 = true;
            if (u.getEmail().equals("u3@example.com"))
                foundU3 = true;
        }
        assertTrue(foundU2);
        assertTrue(foundU3);
    }
}
