package com.queueease.service;

import com.queueease.dto.Dtos.*;
import com.queueease.entity.*;
import com.queueease.exception.ApiException;
import com.queueease.repository.*;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.*;
import java.util.*;
import java.util.regex.*;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service @RequiredArgsConstructor
public class OrderService {
    static final List<String> ACTIVE = List.of("pending", "waiting", "called", "processing", "printing", "binding");
    static final List<String> HOLD = List.of("pending", "waiting", "called", "processing", "printing", "binding", "ready");
    private static final Set<String> ALLOWED = Set.of("pdf", "jpg", "jpeg", "png");
    private static final Pattern RANGE = Pattern.compile("^(\\d+)(?:-(\\d+))?$");

    private final OrderRepository orders;
    private final ItemRepository itemRepo;
    private final NotificationRepository notifs;
    private final UserRepository users;
    private final SettingService settings;
    private final StorageService storage;

    public record FileData(Path path, String name, String type) {}

    // ---------- create (join queue) ----------
    @Transactional
    public Map<String, Object> create(Long uid, OrderReq r, List<MultipartFile> uploads) {
        User u = users.findById(uid).orElseThrow(() -> new ApiException(401, "Please login again."));
        if (!"STUDENT".equals(u.getRole())) throw new ApiException(403, "Only students can place orders.");
        if (!settings.isOpen()) throw new ApiException(409, "The shop is currently closed.");
        List<MultipartFile> ups = uploads == null ? List.of() : uploads.stream().filter(f -> !f.isEmpty()).toList();
        List<FileOpt> opts = r.files() == null ? List.of() : r.files();
        List<ItemQty> want = r.items() == null ? List.of() : r.items();
        if (ups.size() != opts.size()) throw new ApiException(400, "Please upload a document.");
        if (ups.isEmpty() && want.isEmpty()) throw new ApiException(400, "Please select at least one item or upload a document.");
        if (ups.size() > 10) throw new ApiException(400, "You can upload at most 10 files per order.");

        ShopOrder o = new ShopOrder();
        int sc = 0;
        for (ItemQty q : want) {
            if (q.qty() < 1) throw new ApiException(400, "Please select a valid quantity.");
            Item it = itemRepo.findById(q.id()).orElseThrow(() -> new ApiException(404, "Item not found."));
            if (it.getStock() < q.qty()) throw new ApiException(409, "This item is currently out of stock.");
            it.setStock(it.getStock() - q.qty());
            o.getItems().add(new OrderLine(it.getId(), it.getName(), q.qty(), it.getPrice()));
            sc += it.getPrice() * q.qty();
        }

        Map<String, Integer> pr = settings.prices();
        int printCost = 0, copies = 0;
        String bChk = r.binding() == null ? "none" : r.binding();
        if (!Set.of("none", "spiral", "thermal").contains(bChk)) throw new ApiException(400, "Invalid binding option.");
        List<String> saved = new ArrayList<>();
        try {
            for (int i = 0; i < ups.size(); i++) {
                MultipartFile mf = ups.get(i);
                FileOpt fo = opts.get(i);
                String orig = mf.getOriginalFilename() == null ? "file" : mf.getOriginalFilename();
                String ext = orig.contains(".") ? orig.substring(orig.lastIndexOf('.') + 1).toLowerCase() : "";
                if (!ALLOWED.contains(ext)) throw new ApiException(400, "This file type is not supported.");
                String fid = UUID.randomUUID().toString();
                String path;
                try { path = storage.save(u.getRollNo(), fid, orig, mf); }
                catch (IOException e) { throw new ApiException(500, "Could not store the file."); }
                saved.add(path);
                if (!magicOk(ext, storage.head(path, 8))) throw new ApiException(400, "This file type is not supported.");
                int pages = ext.equals("pdf") ? pdfPages(storage.resolve(path)) : 1;
                Integer n = rangeCount(fo.range(), pages);
                if (n == null) throw new ApiException(400, "Invalid page range for " + orig + ".");
                String colorOpt = fo.color() == null ? "Black & White" : fo.color();
                if (!Set.of("Black & White", "Color").contains(colorOpt)) throw new ApiException(400, "Invalid colour option.");
                String paper = fo.paper() == null ? "A4" : fo.paper();
                String type = fo.type() == null ? "Normal" : fo.type();
                String sides = fo.sides() == null ? "Double-sided" : fo.sides();
                if (!Set.of("A4", "A3").contains(paper) || !Set.of("Normal", "Thick", "Glossy").contains(type)
                    || !Set.of("Single-sided", "Double-sided").contains(sides))
                    throw new ApiException(400, "Invalid print option.");
                int cp = fo.copies() == null ? 1 : fo.copies();
                if (cp < 1 || cp > 500) throw new ApiException(400, "Copies must be between 1 and 500.");
                int rate = colorOpt.equals("Color") ? pr.get("color") : pr.get("bw");
                if (paper.equals("A3")) rate *= 2;
                if (type.equals("Thick")) rate += 1;
                if (type.equals("Glossy")) rate += 3;
                int cost = n * cp * rate;
                printCost += cost;
                copies += cp;
                o.getFiles().add(new PrintFile(fid, orig, ext, mf.getSize(), pages,
                    fo.range() == null ? "" : fo.range().trim(), colorOpt, sides, cp, paper, type, path, false, cost));
            }
        } catch (RuntimeException e) {
            saved.forEach(storage::delete);   // do not keep files of an order that failed
            throw e;
        }

        String b = r.binding() == null ? "none" : r.binding();
        if (!Set.of("none", "spiral", "thermal").contains(b)) throw new ApiException(400, "Invalid binding option.");
        if (ups.isEmpty()) b = "none";
        int bind = b.equals("none") ? 0 : pr.get(b) * copies;

        o.setUserId(uid); o.setStudentId(u.getRollNo()); o.setStudentName(u.getUsername());
        o.setBinding(b); o.setBindingColor(r.bindingColor()); o.setCoverType(r.coverType());
        o.setStationeryTotal(sc); o.setTotal(sc + printCost + bind);
        o.setToken(settings.nextToken()); o.setTokenDate(LocalDate.now());
        o.setStatus(ups.isEmpty() ? "waiting" : "pending");
        o.setJoinedAt(LocalDateTime.now());
        orders.save(o);
        notify(uid, "Your token #" + o.getToken() + " has been confirmed."
            + (ups.isEmpty() ? "" : " Staff will review your documents shortly."));
        return toDto(o, orders.findByTokenDateAndStatusIn(LocalDate.now(), ACTIVE), settings.times());
    }

    // ---------- list ----------
    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(Long uid, boolean staff) {
        List<ShopOrder> l = staff ? orders.findByJoinedAtAfterOrderByIdAsc(LocalDateTime.now().minusDays(3))
                                  : orders.findByUserIdOrderByIdAsc(uid);
        List<ShopOrder> active = orders.findByTokenDateAndStatusIn(LocalDate.now(), ACTIVE);
        Map<String, Integer> t = settings.times();
        return l.stream().map(o -> toDto(o, active, t)).toList();
    }

    // ---------- staff actions ----------
    @Transactional
    public void act(Long id, String a) {
        ShopOrder o = orders.findById(id).orElseThrow(() -> new ApiException(404, "Order not found."));
        String s = o.getStatus();
        String tk = "#" + o.getToken();
        boolean hasFiles = !o.getFiles().isEmpty();
        LocalDateTime now = LocalDateTime.now();
        switch (a) {
            case "accept" -> {
                need(s, "pending");
                if (o.getFiles().stream().anyMatch(f -> !f.isSeen()))
                    throw new ApiException(409, "Please preview all files before accepting.");
                o.setStatus("waiting");
                notify(o.getUserId(), "Token " + tk + ": your documents were accepted. You are in the queue.");
            }
            case "reject" -> {
                need(s, "pending");
                o.setStatus("rejected"); restock(o);
                notify(o.getUserId(), "Token " + tk + ": your print order was rejected. Please check your files and try again.");
            }
            case "call" -> {
                need(s, "waiting");
                o.setStatus("called"); o.setCalledAt(now); settings.set("serving", o.getToken());
                notify(o.getUserId(), "Token " + tk + " - Please proceed to the counter.");
            }
            case "process" -> {
                need(s, "called");
                o.setStatus("processing");
                notify(o.getUserId(), "Your order is now being processed.");
            }
            case "printing" -> {
                need(s, "processing");
                if (!hasFiles) throw new ApiException(409, "This order has nothing to print.");
                o.setStatus("printing");
            }
            case "binding" -> {
                need(s, "printing");
                if ("none".equals(o.getBinding())) throw new ApiException(409, "This order has no binding.");
                o.setStatus("binding");
            }
            case "ready" -> {
                boolean ok = ("processing".equals(s) && !hasFiles)
                    || ("printing".equals(s) && "none".equals(o.getBinding())) || "binding".equals(s);
                if (!ok) throw new ApiException(409, "This action is not allowed for the current status.");
                o.setStatus("ready"); o.setReadyAt(now);
                notify(o.getUserId(), "Your order is ready for collection.");
            }
            case "complete" -> { need(s, "ready"); o.setStatus("completed"); o.setDoneAt(now); }
            case "skip" -> {
                need(s, "waiting", "called");
                o.setStatus("skipped");
                notify(o.getUserId(), "Token " + tk + " was skipped. Please rejoin the queue.");
            }
            default -> throw new ApiException(400, "Unknown action.");
        }
    }

    @Transactional
    public void callNext() {
        ShopOrder o = orders.findFirstByTokenDateAndStatusOrderByTokenAsc(LocalDate.now(), "waiting")
            .orElseThrow(() -> new ApiException(404, "No one is waiting."));
        act(o.getId(), "call");
    }

    @Transactional
    public void leave(Long uid, Long id) {
        ShopOrder o = orders.findById(id).filter(x -> x.getUserId().equals(uid))
            .orElseThrow(() -> new ApiException(404, "Order not found."));
        if (!List.of("pending", "waiting").contains(o.getStatus()))
            throw new ApiException(409, "You can only leave the queue before processing starts.");
        if (o.getFiles().stream().anyMatch(PrintFile::isSeen))
            throw new ApiException(409, "Staff has already opened your document, so this order can no longer be cancelled.");
        o.setStatus("cancelled");
        restock(o);
    }

    // ---------- files ----------
    @Transactional
    public FileData file(String fid, Long uid, boolean staff, boolean view) {
        ShopOrder o = orders.findByFileId(fid).orElseThrow(() -> new ApiException(404, "File not found."));
        if (!staff && !o.getUserId().equals(uid)) throw new ApiException(403, "You do not have permission to open this file.");
        PrintFile f = o.getFiles().stream().filter(x -> x.getFid().equals(fid)).findFirst()
            .orElseThrow(() -> new ApiException(404, "File not found."));
        if (view && staff) f.setSeen(true);
        Path p = storage.resolve(f.getStoredPath());
        if (!Files.exists(p)) throw new ApiException(404, "File not found.");
        return new FileData(p, f.getName(), mime(f.getExt()));
    }

    // ---------- helpers ----------
    private void notify(Long uid, String msg) { notifs.save(new Notification(uid, msg)); }

    private void restock(ShopOrder o) {
        for (OrderLine l : o.getItems())
            itemRepo.findById(l.getItemId()).ifPresent(it -> it.setStock(it.getStock() + l.getQty()));
    }

    private static void need(String s, String... ok) {
        if (!Arrays.asList(ok).contains(s)) throw new ApiException(409, "This action is not allowed for the current status.");
    }

    static String mime(String ext) {
        return switch (ext) { case "pdf" -> "application/pdf"; case "png" -> "image/png"; default -> "image/jpeg"; };
    }

    static boolean magicOk(String ext, byte[] d) {
        if (d.length < 4) return false;
        return switch (ext) {
            case "pdf" -> d[0] == '%' && d[1] == 'P' && d[2] == 'D' && d[3] == 'F';
            case "png" -> (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G';
            case "jpg", "jpeg" -> (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8;
            default -> false;
        };
    }

    static int pdfPages(Path file) {
        try (PDDocument doc = Loader.loadPDF(file.toFile())) { return doc.getNumberOfPages(); }
        catch (IOException e) { throw new ApiException(400, "This PDF could not be read. It may be damaged or password protected."); }
    }

    /** Number of pages selected by "1-5, 8, 10-12" (blank = all). Returns null when invalid. */
    static Integer rangeCount(String r, int total) {
        if (r == null || r.isBlank()) return total;
        Set<Integer> set = new HashSet<>();
        for (String part : r.split(",")) {
            Matcher m = RANGE.matcher(part.trim());
            if (!m.matches()) return null;
            int a = Integer.parseInt(m.group(1));
            int b = m.group(2) != null ? Integer.parseInt(m.group(2)) : a;
            if (a < 1 || b < a || b > total) return null;
            for (int i = a; i <= b; i++) set.add(i);
        }
        return set.size();
    }

    private static Long ms(LocalDateTime d) { return d == null ? null : d.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(); }

    private static int svc(ShopOrder a, Map<String, Integer> t) {
        return a.getFiles().isEmpty() ? t.get("s") : "none".equals(a.getBinding()) ? t.get("p") : t.get("b");
    }

    private Map<String, Object> toDto(ShopOrder o, List<ShopOrder> active, Map<String, Integer> t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", o.getId()); m.put("token", o.getToken()); m.put("sid", o.getStudentId()); m.put("name", o.getStudentName());
        m.put("items", o.getItems().stream().map(i -> Map.of("id", i.getItemId(), "qty", i.getQty())).toList());
        m.put("files", o.getFiles().stream().map(f -> {
            Map<String, Object> x = new LinkedHashMap<>();
            x.put("fid", f.getFid()); x.put("name", f.getName()); x.put("ext", f.getExt()); x.put("size", f.getSize());
            x.put("pages", f.getPages()); x.put("range", f.getPageRange()); x.put("color", f.getColor()); x.put("sides", f.getSides());
            x.put("copies", f.getCopies()); x.put("paper", f.getPaper()); x.put("type", f.getPaperType()); x.put("seen", f.isSeen());
            return x;
        }).toList());
        m.put("binding", o.getBinding()); m.put("total", o.getTotal()); m.put("sc", o.getStationeryTotal());
        m.put("status", o.getStatus()); m.put("joined", ms(o.getJoinedAt())); m.put("ca", ms(o.getCalledAt()));
        m.put("ra", ms(o.getReadyAt())); m.put("da", ms(o.getDoneAt()));
        int ahead = 0, wait = 0;
        if (ACTIVE.contains(o.getStatus()))
            for (ShopOrder a : active)
                if (a.getTokenDate().equals(o.getTokenDate()) && a.getToken() < o.getToken()) { ahead++; wait += svc(a, t); }
        m.put("ahead", ahead); m.put("wait", wait);
        return m;
    }
}
