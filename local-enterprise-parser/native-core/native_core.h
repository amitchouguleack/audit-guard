#ifndef NATIVE_CORE_H
#define NATIVE_CORE_H

#include <string>
#include <vector>
#include <utility>

struct MatchResult {
    std::string pattern_type;
    std::string severity;
    std::string matched_text;
    size_t start_offset;
    size_t end_offset;
};

class NativeScanner {
public:
    NativeScanner();
    ~NativeScanner();

    std::vector<MatchResult> scan(const char* content, size_t length);
    void add_pattern(const std::string& name, const std::string& regex, const std::string& severity);

private:
    struct Pattern {
        std::string name;
        std::string regex;
        std::string severity;
    };

    std::vector<Pattern> patterns_;
};

extern "C" {
    NativeScanner* create_scanner();
    void destroy_scanner(NativeScanner* scanner);
    MatchResult* scan_content(NativeScanner* scanner, const char* content, size_t length, size_t* result_count);
    void free_results(MatchResult* results, size_t count);
}

#endif
