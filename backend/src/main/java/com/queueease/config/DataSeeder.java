package com.queueease.config;

import com.queueease.entity.Item;
import com.queueease.entity.User;
import com.queueease.repository.ItemRepository;
import com.queueease.repository.SettingRepository;
import com.queueease.repository.UserRepository;
import com.queueease.service.SettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Creates the staff login, starter stationery and default prices the first time the app starts. */
@Component @RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final ItemRepository items;
    private final SettingRepository settingRepo;
    private final SettingService settings;
    private final PasswordEncoder encoder;

    @Value("${app.staff.username:staff}") private String staffUser;
    @Value("${app.staff.password:staff123}") private String staffPass;

    @Override
    public void run(String... args) {
        // No demo accounts: the only account created is the staff login (username + password from configuration).
        if (!staffUser.isBlank() && !staffPass.isBlank() && !users.existsByUsernameIgnoreCase(staffUser)) {
            User staff = new User();
            staff.setUsername(staffUser.trim());
            staff.setPassword(encoder.encode(staffPass)); staff.setRole("STAFF");
            users.save(staff);
        }
        if (items.count() == 0) {
            Object[][] d = {
                {"Record Book", "Record Books", 45, 34, "📘"}, {"Long Notebook", "Notebooks", 60, 12, "📓"},
                {"Blue Pen", "Pens", 10, 100, "🖊️"}, {"Black Pen", "Pens", 10, 100, "🖋️"},
                {"File", "Files", 25, 40, "📁"}, {"Graph Sheet", "Graph Sheets", 5, 200, "📈"},
                {"Lab Record", "Lab Materials", 50, 20, "🧪"}, {"Pencil", "Pencils", 5, 25, "✏️"}};
            for (Object[] r : d) {
                Item i = new Item();
                i.setName((String) r[0]); i.setCategory((String) r[1]); i.setPrice((Integer) r[2]);
                i.setStock((Integer) r[3]); i.setIcon((String) r[4]);
                items.save(i);
            }
        }
        if (settingRepo.count() == 0) {
            settings.set("price_bw", 2); settings.set("price_color", 5); settings.set("price_spiral", 30); settings.set("price_thermal", 40);
            settings.set("svc_s", 3); settings.set("svc_p", 5); settings.set("svc_b", 8); settings.set("shop_open", 1);
        }
    }
}
